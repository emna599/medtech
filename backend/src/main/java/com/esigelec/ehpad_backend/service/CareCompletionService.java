package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.CompleteRequest;
import com.esigelec.ehpad_backend.dto.ServiceItemDto;
import com.esigelec.ehpad_backend.dto.ServiceKind;
import com.esigelec.ehpad_backend.exception.ConflictException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class CareCompletionService {
    private final JdbcTemplate jdbc;
    private final CurrentUserService users;
    private final CareService care;
    private final StaffService staff;

    public CareCompletionService(JdbcTemplate jdbc, CurrentUserService users, CareService care, StaffService staff) {
        this.jdbc = jdbc;
        this.users = users;
        this.care = care;
        this.staff = staff;
    }

    @Transactional
    public ServiceItemDto complete(ServiceKind kind, Long id, CompleteRequest request, UUID requestId, String username) {
        if (kind == ServiceKind.MEDICAMENT) staff.requireMedicationAccess(username);
        if (requestId != null) {
            Long userId = users.require(username).getId();
            String fingerprint = fingerprint(kind, id, request);
            int inserted = jdbc.update("""
                    insert into care_completion_receipt (user_id, request_id, fingerprint) values (?, ?, ?)
                    on conflict (user_id, request_id) do nothing
                    """, userId, requestId, fingerprint);
            if (inserted == 0) {
                String previous = jdbc.queryForObject("""
                        select fingerprint from care_completion_receipt where user_id = ? and request_id = ?
                        """, String.class, userId, requestId);
                if (!fingerprint.equals(previous)) {
                    throw new ConflictException("Cette référence a déjà été utilisée pour une autre validation.");
                }
                return care.currentItem(kind, id, username);
            }
        }

        // Le reçu et la validation métier sont dans la même transaction.
        return kind == ServiceKind.REPAS ? care.completeMeal(id, request, username) : care.completeDose(id, request, username);
    }

    private static String fingerprint(ServiceKind kind, long id, CompleteRequest request) {
        String version = request.mealRiskVersion();
        String comment = request.comment();
        String payload = kind + "\n" + id + "\n" + request.status() + "\n" + request.riskAcknowledged() + "\n"
                + (version == null ? "-1:" : version.length() + ":" + version)
                + (comment == null ? "-1:" : comment.length() + ":" + comment);
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponible", exception);
        }
    }
}
