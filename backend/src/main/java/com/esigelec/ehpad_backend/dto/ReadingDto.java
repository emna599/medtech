package com.esigelec.ehpad_backend.dto;

/** Résultat d'une lecture : OK (installé), ALREADY (déjà à cette table), MOVED (venait d'une autre table) ou LEFT (parti). */
public record ReadingDto(String status, Long residentId, String residentName, String tableLabel, String message) {
}
