package com.esigelec.ehpad_backend.dto;

/**
 * Résultat de la lecture d'une étiquette de pochette. L'OCR ne fait que proposer un résident :
 * le soignant doit toujours comparer le visage à la photo avant de s'en servir.
 *
 * @param status FOUND, NOT_FOUND, AMBIGUOUS ou UNAVAILABLE (service de lecture non démarré)
 */
public record PochetteScanDto(
        String status,
        String message,
        ResidentCardDto resident,
        String nameRead,
        String prise,
        String date,
        String medications) {
}
