package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.HandoverActionDto;
import com.esigelec.ehpad_backend.dto.HandoverRequest;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.HandoverRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class HandoverService {
    public record Board(List<HandoverActionDto> open, List<HandoverActionDto> recentlyCompleted) {}

    private final HandoverRepository handovers;
    private final ResidentRepository residents;
    private final CurrentUserService users;
    private final AuditService audit;

    public HandoverService(HandoverRepository handovers, ResidentRepository residents,
                           CurrentUserService users, AuditService audit) {
        this.handovers = handovers;
        this.residents = residents;
        this.users = users;
        this.audit = audit;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Board board() {
        return new Board(handovers.listOpen(), handovers.listRecentlyCompleted());
    }

    @Transactional
    public HandoverActionDto create(HandoverRequest request, String username) {
        User user = users.require(username);
        String observation = cleanText(request.observation());
        String action = cleanText(request.expectedAction());
        Long residentId = request.residentId();
        var existing = handovers.findByRequest(user.getId(), request.requestId());
        if (existing.isPresent()) {
            return sameRequest(existing.get(), residentId, observation, action);
        }
        if (residentId != null) {
            residents.findByIdForUpdate(residentId).filter(Resident::isActive)
                    .orElseThrow(() -> new ResourceNotFoundException("Résident actif introuvable"));
        }
        var inserted = handovers.insert(user.getId(), request.requestId(), residentId, observation, action);
        if (inserted.isEmpty()) {
            return sameRequest(handovers.findByRequest(user.getId(), request.requestId()).orElseThrow(),
                    residentId, observation, action);
        }
        long id = inserted.get();
        audit.record(user, "RELEVE_CREEE", "HandoverAction", id);
        return find(id);
    }

    @Transactional
    public HandoverActionDto complete(long id, String username) {
        User user = users.require(username);
        if (!handovers.complete(id, user.getId())) {
            find(id);
            throw new ConflictException("Cette action a déjà été terminée.");
        }
        audit.record(user, "RELEVE_TERMINEE", "HandoverAction", id);
        return find(id);
    }

    private HandoverActionDto find(long id) {
        return handovers.find(id).orElseThrow(() -> new ResourceNotFoundException("Transmission introuvable"));
    }

    private static HandoverActionDto sameRequest(HandoverActionDto entry, Long residentId,
                                                  String observation, String action) {
        if (!Objects.equals(entry.residentId(), residentId)
                || !entry.observation().equals(observation) || !entry.expectedAction().equals(action)) {
            throw new ConflictException("Ce formulaire a déjà été enregistré avec un autre contenu.");
        }
        return entry;
    }

    private static String cleanText(String text) {
        String normalized = text.replace("\r\n", "\n").strip();
        boolean visible = normalized.codePoints().anyMatch(code -> !Character.isWhitespace(code)
                && !Character.isSpaceChar(code) && Character.getType(code) != Character.FORMAT);
        boolean invalid = normalized.codePoints().anyMatch(code -> (Character.isISOControl(code) && code != '\n')
                || (code >= 0x202A && code <= 0x202E) || (code >= 0x2066 && code <= 0x2069));
        if (!visible || invalid) {
            throw new BadRequestException("Saisissez un texte visible, sans caractères de contrôle.");
        }
        return normalized;
    }
}
