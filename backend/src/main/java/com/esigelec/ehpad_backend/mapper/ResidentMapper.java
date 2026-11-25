package com.esigelec.ehpad_backend.mapper;

import com.esigelec.ehpad_backend.dto.MedicalRecordDto;
import com.esigelec.ehpad_backend.dto.ResidentDetailDto;
import com.esigelec.ehpad_backend.dto.ResidentSummaryDto;
import com.esigelec.ehpad_backend.entity.MedicalRecord;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.Room;

public final class ResidentMapper {

    private ResidentMapper() {
    }

    public static ResidentSummaryDto toSummary(Resident resident) {
        Room room = resident.getRoom();

        return new ResidentSummaryDto(
                resident.getId(),
                resident.getFirstName(),
                resident.getLastName(),
                resident.getBirthDate(),
                resident.isActive(),
                room == null ? null : room.getNumber(),
                room == null ? null : room.getFloor());
    }

    public static ResidentDetailDto toDetail(Resident resident) {
        ResidentSummaryDto summary = toSummary(resident);

        return new ResidentDetailDto(
                summary.id(),
                summary.firstName(),
                summary.lastName(),
                summary.birthDate(),
                summary.active(),
                summary.roomNumber(),
                summary.floor(),
                resident.getAdmissionDate());
    }

    public static MedicalRecordDto toDto(MedicalRecord medicalRecord) {
        return new MedicalRecordDto(
                medicalRecord.getHistory(),
                medicalRecord.getTreatments(),
                medicalRecord.getUpdatedAt());
    }
}
