package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.ServiceStatus;

import java.time.LocalDate;
import java.util.List;

/**
 * Salle à manger : les tables et, à chaque table, les résidents réellement présents (bracelet lu par le lecteur de la table).
 * Les résidents s'installent où ils veulent : il n'y a pas de place attribuée.
 */
public record DiningDto(
        /** Repas affiché : DEJEUNER ou DINER. */
        String slot,
        LocalDate date,
        /** Plat du jour pour ce repas (menu de la semaine), ou null si aucun menu n'est saisi. */
        MenuEntryDto menu,
        /** Résidents installés à une table, et parmi eux ceux déjà servis. */
        int seated,
        int served,
        List<Table> tables) {

    /** present = résidents à la table (8 au maximum) ; seats = leur liste, dans l'ordre d'arrivée. */
    public record Table(Long id, String label, int capacity, int present, int served, String readerCode, List<Seat> seats) {
    }

    public record Seat(int position, Identity resident, String chevalet, Meal meal) {}

    public record Identity(Long id, String firstName, String lastName, String room) {}

    public record Meal(Long id, ServiceStatus status, String preparation) {}
}
