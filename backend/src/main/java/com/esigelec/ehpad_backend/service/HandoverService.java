package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.HandoverActionDto;
import com.esigelec.ehpad_backend.dto.HandoverRequest;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.entity.Shift;
import org.springframework.security.access.AccessDeniedException;
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
    public record Board(List<HandoverActionDto> open, List<HandoverActionDto> recentlyCompleted, Shift shift) {}

    private final HandoverRepository handovers;
    private final ResidentRepository residents;
    private final CurrentUserService users;
    private final AuditService audit;
    private final StaffService staff;

    public HandoverService(HandoverRepository handovers, ResidentRepository residents,
                           CurrentUserService users, AuditService audit, StaffService staff) {
        this.handovers = handovers;
        this.residents = residents;
        this.users = users;
        this.audit = audit;
        this.staff = staff;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Board board(String username) {
        User user = users.require(username);
        Shift shift = staff.shiftOf(user);
        return new Board(handovers.listOpen(user.getId(), shift), handovers.listRecentlyCompleted(user.getId(), shift), shift);
    }

    @Transactional
    public HandoverActionDto create(HandoverRequest request, String username) {
        User user = users.require(username);
        String observation = cleanText(request.observation());
        String action = cleanText(request.expectedAction());
        Long residentId = request.residentId();
        var existing = handovers.findByRequest(user.getId(), request.requestId());
        if (existing.isPresent()) {
            return sameRequest(existing.get(), residentId, observation, action, request.targetShift());
        }
        if (residentId != null) {
            residents.findByIdForUpdate(residentId).filter(Resident::isActive)
                    .orElseThrow(() -> new ResourceNotFoundException("Résident actif introuvable"));
        }
        var inserted = handovers.insert(user.getId(), request.requestId(), residentId, observation, action, request.targetShift());
        if (inserted.isEmpty()) {
            return sameRequest(handovers.findByRequest(user.getId(), request.requestId()).orElseThrow(),
                    residentId, observation, action, request.targetShift());
        }
        long id = inserted.get();
        audit.record(user, "RELEVE_CREEE", "HandoverAction", id);
        return find(id);
    }

    public enum Assignment { CLAIM, RELEASE, TAKE_OVER }
    public record AssignmentRequest(@jakarta.validation.constraints.NotNull Assignment action,
                                    @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.PositiveOrZero Long version) {}
    public record CompletionRequest(@jakarta.validation.constraints.NotNull @jakarta.validation.constraints.PositiveOrZero Long version) {}

    @Transactional
    public HandoverActionDto assign(long id, AssignmentRequest request, String username) {
        User user = users.require(username);
        HandoverActionDto entry = find(id);
        requireTargetTeam(entry, user);
        Long assignee = entry.assignedTo();
        if (entry.completedAt() != null || entry.assignmentVersion() != request.version()) {
            throw new ConflictException("L’attribution de cette action a changé. Actualisez la relève.");
        }
        Long next = switch (request.action()) {
            case CLAIM -> {
                if (assignee != null) throw new ConflictException("Cette action est déjà attribuée.");
                yield user.getId();
            }
            case RELEASE -> {
                if (!Objects.equals(assignee, user.getId())) {
                    throw new ConflictException("Seul le titulaire peut libérer cette action.");
                }
                yield null;
            }
            case TAKE_OVER -> {
                if (assignee == null || Objects.equals(assignee, user.getId())) {
                    throw new ConflictException("Cette action ne peut pas être reprise dans son état actuel.");
                }
                yield user.getId();
            }
        };
        if (!handovers.assign(id, next, request.version())) {
            throw new ConflictException("L’attribution de cette action a changé. Actualisez la relève.");
        }
        audit.record(user, "RELEVE_" + request.action().name(), "HandoverAction", id);
        return find(id);
    }

    @Transactional
    public HandoverActionDto complete(long id, CompletionRequest request, String username) {
        User user = users.require(username);
        requireTargetTeam(find(id), user);
        if (!handovers.complete(id, user.getId(), request.version())) {
            find(id);
            throw new ConflictException("Cette action a changé ou vous n’en êtes plus le titulaire.");
        }
        audit.record(user, "RELEVE_TERMINEE", "HandoverAction", id);
        return find(id);
    }

    private void requireTargetTeam(HandoverActionDto entry, User user) {
        if (entry.targetShift() != null && entry.targetShift() != staff.shiftOf(user)) {
            throw new AccessDeniedException("Cette transmission est réservée à l’équipe destinataire");
        }
    }

    private HandoverActionDto find(long id) {
        return handovers.find(id).orElseThrow(() -> new ResourceNotFoundException("Transmission introuvable"));
    }

    private static HandoverActionDto sameRequest(HandoverActionDto entry, Long residentId,
                                                  String observation, String action, Shift shift) {
        if (!Objects.equals(entry.residentId(), residentId) || entry.targetShift() != shift
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
