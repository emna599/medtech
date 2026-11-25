package com.esigelec.ehpad_backend.dto;

/** Chambre avec son taux d'occupation (nombre de résidents actifs). */
public record RoomDto(Long id, String number, int floor, int capacity, long occupied) {
}
