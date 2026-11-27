package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import com.esigelec.ehpad_backend.repository.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class RfidBadgeService {
    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final ResidentRepository residents;
    private final CurrentUserService currentUser;
    private final AuditService audit;
    private final TeamService team;

    public RfidBadgeService(JdbcTemplate jdbc, UserRepository users, ResidentRepository residents,
                            CurrentUserService currentUser, AuditService audit, TeamService team) {
        this.jdbc = jdbc;
        this.users = users;
        this.residents = residents;
        this.currentUser = currentUser;
        this.audit = audit;
        this.team = team;
    }

    public boolean staffBadge(long id) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "select exists (select 1 from staff_rfid_badge where user_id = ?)", Boolean.class, id));
    }

    public boolean residentBadge(long id) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "select exists (select 1 from resident_nfc_tag where resident_id = ? and active)", Boolean.class, id));
    }

    @Transactional
    public void assignStaff(long id, String code, String actor) {
        var user = users.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Compte introuvable"));
        if (user.getRole() != Role.PERSONNEL || !user.isEnabled()) {
            throw new BadRequestException("Choisissez un compte Personnel actif");
        }
        try {
            jdbc.update("""
                    insert into staff_rfid_badge (user_id, token_hash) values (?, ?)
                    on conflict (user_id) do update
                    set token_hash = excluded.token_hash, assigned_at = statement_timestamp()
                    """, id, hash(code));
        } catch (DuplicateKeyException duplicate) {
            throw new ConflictException("Ce badge est déjà attribué");
        }
        audit.record(currentUser.require(actor), "RFID_PERSONNEL_ATTRIBUE", "User", id);
    }

    @Transactional
    public void revokeStaff(long id, String actor) {
        users.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Compte introuvable"));
        if (jdbc.update("delete from staff_rfid_badge where user_id = ?", id) > 0) {
            audit.record(currentUser.require(actor), "RFID_PERSONNEL_REVOQUE", "User", id);
        }
    }

    @Transactional
    public void assignResident(long id, String code, String actor) {
        residents.findByIdForUpdate(id).filter(Resident::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Résident actif introuvable"));
        String token = code.trim();
        if (residents.findActiveByIdentityCode(token).isPresent() || residents.findResidentIdByActiveQrToken(token).isPresent()) {
            throw new ConflictException("Ce code est déjà utilisé pour une autre forme d’identification");
        }
        int assigned = jdbc.update("""
                insert into resident_nfc_tag (token, resident_id) values (?, ?)
                on conflict (token) do update set active = true, resident_id = excluded.resident_id
                where resident_nfc_tag.resident_id = excluded.resident_id or not resident_nfc_tag.active
                """, token, id);
        if (assigned == 0) throw new ConflictException("Ce bracelet est déjà attribué");
        jdbc.update("update resident_nfc_tag set active = false where resident_id = ? and token <> ? and active", id, token);
        audit.record(currentUser.require(actor), "RFID_RESIDENT_ATTRIBUE", "Resident", id);
    }

    @Transactional
    public void revokeResident(long id, String actor) {
        residents.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));
        if (jdbc.update("update resident_nfc_tag set active = false where resident_id = ? and active", id) > 0) {
            audit.record(currentUser.require(actor), "RFID_RESIDENT_REVOQUE", "Resident", id);
        }
    }

    @Transactional
    public boolean point(String username, String code, boolean leaving) {
        var user = users.findByUsernameForUpdate(username).filter(u -> u.isEnabled() && u.getRole() == Role.PERSONNEL)
                .orElseThrow(() -> new AccessDeniedException("Pointage indisponible"));
        if (jdbc.queryForList("select user_id from staff_rfid_badge where user_id = ? and token_hash = ?",
                Long.class, user.getId(), hash(code)).isEmpty()) {
            throw new AccessDeniedException("Ce badge ne correspond pas au compte connecté");
        }
        return (leaving ? team.checkOut(username) : team.checkIn(username)).present();
    }

    private static String hash(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(raw.trim().getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException err) {
            throw new IllegalStateException("SHA-256 indisponible", err);
        }
    }
}
