package com.esigelec.ehpad_backend.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Appétit d'un résident sur quelques jours. Un score va de 0 (n'a rien mangé ou a refusé) à 1 (a tout mangé).
 * {@code declining} signale une baisse à transmettre à l'équipe : indicateur d'alerte, pas un diagnostic.
 */
public record AppetiteDto(
        List<Day> days,
        Double recentAverage,
        Double previousAverage,
        boolean declining) {

    /** Une journée : score moyen des repas (null s'il n'y a pas de repas enregistré) et nombre de refus. */
    public record Day(LocalDate date, Double score, int meals, int refused) {
    }
}
