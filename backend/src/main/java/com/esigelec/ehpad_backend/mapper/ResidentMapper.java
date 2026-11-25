package com.esigelec.ehpad_backend.mapper;

import com.esigelec.ehpad_backend.dto.ResidentDto;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.Room;

public final class ResidentMapper {

    private ResidentMapper() {
    }

    /** À appeler dans une transaction (la chambre est chargée à la demande). */
    public static ResidentDto toDto(Resident resident) {
        Room room = resident.getRoom();
        return new ResidentDto(
                resident.getId(),
                resident.getFirstName(),
                resident.getLastName(),
                resident.getBirthDate(),
                resident.getAdmissionDate(),
                resident.isActive(),
                room == null ? null : room.getId(),
                room == null ? null : room.getNumber(),
                room == null ? null : room.getFloor());
    }
}
