package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChevaletService {

    private final JdbcTemplate jdbc;
    private final ResidentRepository residents;
    private final CurrentUserService currentUser;
    private final AuditService audit;

    public ChevaletService(JdbcTemplate jdbc, ResidentRepository residents, CurrentUserService currentUser,
                          AuditService audit) {
        this.jdbc = jdbc;
        this.residents = residents;
        this.currentUser = currentUser;
        this.audit = audit;
    }

    @Transactional
    public void assign(long residentId, String code, String username) {
        User user = currentUser.require(username);
        lockActiveResident(residentId);
        boolean atTable = Boolean.TRUE.equals(jdbc.queryForObject("""
                select exists (
                    select 1 from table_presence
                    where resident_id = ? and left_at is null and arrived_at >= current_date
                )
                """, Boolean.class, residentId));
        if (!atTable) throw new ConflictException("Installez d’abord le résident à une table.");

        Long existing = jdbc.query("""
                select id, code from chevalet where resident_id = ?
                """, rs -> {
            if (!rs.next()) return null;
            if (!code.equals(rs.getString("code"))) {
                throw new ConflictException("Libérez le chevalet actuel avant d’en associer un autre.");
            }
            return rs.getLong("id");
        }, residentId);
        if (existing != null) return;

        Long assigned = jdbc.query("""
                insert into chevalet (code, resident_id, associated_at, associated_by)
                values (?, ?, localtimestamp, ?)
                on conflict (code) do update
                set resident_id = excluded.resident_id, associated_at = excluded.associated_at,
                    associated_by = excluded.associated_by
                where chevalet.resident_id is null
                returning id
                """, rs -> rs.next() ? rs.getLong(1) : null, code, residentId, user.getId());
        if (assigned == null) {
            throw new ConflictException("Ce chevalet est déjà associé. Vérifiez son affectation.");
        }
        audit.record(user, "CHEVALET_ASSOCIE", "Chevalet", assigned);
    }

    @Transactional
    public void release(long residentId, String code, String username) {
        User user = currentUser.require(username);
        lockActiveResident(residentId);
        Long released = jdbc.query("""
                update chevalet set resident_id = null, associated_at = null, associated_by = null
                where resident_id = ? and code = ? returning id
                """, rs -> rs.next() ? rs.getLong(1) : null, residentId, code);
        if (released == null) {
            throw new ConflictException("L’association a changé. Actualisez le service en salle.");
        }
        audit.record(user, "CHEVALET_LIBERE", "Chevalet", released);
    }

    // L’appelant détient déjà le verrou du résident dans la transaction de départ.
    public void releaseForDeparture(long residentId, User user) {
        Long released = jdbc.query("""
                update chevalet set resident_id = null, associated_at = null, associated_by = null
                where resident_id = ? returning id
                """, rs -> rs.next() ? rs.getLong(1) : null, residentId);
        if (released != null) audit.record(user, "CHEVALET_LIBERE", "Chevalet", released);
    }

    private void lockActiveResident(long residentId) {
        residents.findByIdForUpdate(residentId).filter(Resident::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Résident actif introuvable."));
    }
}
