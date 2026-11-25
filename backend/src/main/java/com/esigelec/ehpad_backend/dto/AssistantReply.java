package com.esigelec.ehpad_backend.dto;

import java.util.List;

/**
 * Réponse de l'assistant. Il ne fait jamais d'action lui-même : s'il propose d'en faire une,
 * il la décrit dans {@code action} et le soignant doit la confirmer (le frontend appelle alors
 * la route normale de validation).
 */
public record AssistantReply(
        String answer,
        String intent,
        List<ResidentRef> residents,
        PendingAction action) {

    /** Résident cité dans la réponse : permet d'ouvrir sa fiche. */
    public record ResidentRef(Long id, String name, String room) {
    }

    /** Action proposée, à confirmer par le soignant. */
    public record PendingAction(ServiceKind kind, Long itemId, String summary) {
    }
}
