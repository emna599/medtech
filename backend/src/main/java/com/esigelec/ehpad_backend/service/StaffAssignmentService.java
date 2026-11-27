package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.entity.Job;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

@Service
public class StaffAssignmentService {
    public record Assignment(long id, int floor, OffsetDateTime startsAt, OffsetDateTime endsAt,
                             OffsetDateTime revokedAt) {}

    private final JdbcTemplate jdbc;
    private final CurrentUserService users;
    private final UserRepository repository;
    private final StaffService staff;

    public StaffAssignmentService(JdbcTemplate jdbc, CurrentUserService users, UserRepository repository,
                                  StaffService staff) {
        this.jdbc = jdbc;
        this.users = users;
        this.repository = repository;
        this.staff = staff;
    }

    public Set<Integer> activeFloors(String username) {
        User user = users.require(username);
        return Set.copyOf(jdbc.queryForList("""
                select floor from staff_assignment
                where user_id = ? and revoked_at is null
                  and starts_at <= statement_timestamp() and ends_at > statement_timestamp()
                """, Integer.class, user.getId()));
    }

    public void requireFloor(User user, Integer floor) {
        if (floor == null || jdbc.queryForList("""
                select id from staff_assignment
                where user_id = ? and floor = ? and revoked_at is null
                  and starts_at <= statement_timestamp() and ends_at > statement_timestamp()
                for share
                """, Long.class, user.getId(), floor).isEmpty()) {
            throw new AccessDeniedException("Aucune affectation active pour ce secteur");
        }
    }

    @Transactional(readOnly = true)
    public List<Assignment> list(Long userId) {
        return jdbc.query("""
                select id, floor, starts_at, ends_at, revoked_at
                from staff_assignment where user_id = ? order by starts_at desc, id desc
                """, (row, i) -> new Assignment(row.getLong("id"), row.getInt("floor"),
                row.getObject("starts_at", OffsetDateTime.class), row.getObject("ends_at", OffsetDateTime.class),
                row.getObject("revoked_at", OffsetDateTime.class)), userId);
    }

    @Transactional
    public void grant(Long userId, int floor, OffsetDateTime start, OffsetDateTime end, String actor) {
        User user = lockUser(userId);
        Job job = staff.jobOf(user);
        if (!user.isEnabled() || user.getRole() != Role.PERSONNEL || job == Job.SERVICE) {
            throw new BadRequestException("Choisissez un soignant actif");
        }
        if (!start.isBefore(end)) throw new BadRequestException("La fin doit suivre le début");
        if (!Boolean.TRUE.equals(jdbc.queryForObject("select exists (select 1 from room where floor = ?)",
                Boolean.class, floor))) throw new BadRequestException("Cet étage ne comporte aucune chambre");
        jdbc.update("""
                insert into staff_assignment (user_id, floor, starts_at, ends_at, created_by)
                values (?, ?, ?, ?, ?)
                """, userId, floor, start, end, users.require(actor).getId());
    }

    @Transactional
    public void revoke(Long userId, Long assignmentId, String actor) {
        lockUser(userId);
        if (jdbc.update("""
                update staff_assignment set revoked_at = statement_timestamp(), revoked_by = ?
                where id = ? and user_id = ? and revoked_at is null
                """, users.require(actor).getId(), assignmentId, userId) == 0) {
            throw new ResourceNotFoundException("Affectation active introuvable");
        }
    }

    @Transactional
    public void replace(Long userId, Long assignmentId, Long substituteId, String actor) {
        if (userId.equals(substituteId)) throw new BadRequestException("Choisissez un autre soignant");
        User first = lockUser(Math.min(userId, substituteId));
        User second = lockUser(Math.max(userId, substituteId));
        User original = userId.equals(first.getId()) ? first : second;
        User substitute = substituteId.equals(first.getId()) ? first : second;
        Job job = staff.jobOf(original);
        if (original.getRole() != Role.PERSONNEL || !substitute.isEnabled() || substitute.getRole() != Role.PERSONNEL
                || job == Job.SERVICE || staff.jobOf(substitute) != job) {
            throw new BadRequestException("Choisissez un remplaçant actif de même fonction");
        }

        Long adminId = users.require(actor).getId();
        int replaced = jdbc.update("""
                with removed as (
                    update staff_assignment
                    set revoked_at = statement_timestamp(), revoked_by = ?
                    where id = ? and user_id = ? and revoked_at is null and ends_at > statement_timestamp()
                    returning floor, starts_at, ends_at, revoked_at
                )
                insert into staff_assignment (user_id, floor, starts_at, ends_at, created_by)
                select ?, floor, greatest(starts_at, revoked_at), ends_at, ? from removed
                """, adminId, assignmentId, userId, substituteId, adminId);
        if (replaced == 0) throw new ResourceNotFoundException("Créneau à remplacer introuvable");
    }

    @Transactional
    public void revokeAll(Long userId, String actor) {
        jdbc.update("""
                update staff_assignment set revoked_at = statement_timestamp(), revoked_by = ?
                where user_id = ? and revoked_at is null and ends_at > statement_timestamp()
                """, users.require(actor).getId(), userId);
    }

    private User lockUser(Long userId) {
        return repository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Compte introuvable"));
    }
}
