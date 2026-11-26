package com.esigelec.ehpad_backend.mapper;

import com.esigelec.ehpad_backend.dto.DietaryRegimeDto;
import com.esigelec.ehpad_backend.dto.MedicalAllergyDto;
import com.esigelec.ehpad_backend.dto.QrCodeResidentInfoDto;
import com.esigelec.ehpad_backend.entity.Resident;

import java.util.List;

public final class QrCodeResidentInfoMapper {

    private QrCodeResidentInfoMapper() {
    }

    public static QrCodeResidentInfoDto toDto(
            Resident resident,
            List<MedicalAllergyDto> allergies,
            List<DietaryRegimeDto> dietaryRegimes) {
        return new QrCodeResidentInfoDto(
                resident.getId(),
                resident.getFirstName(),
                resident.getLastName(),
                resident.getBirthDate(),
                resident.getRoom() == null ? null : resident.getRoom().getNumber(),
                resident.getRoom() == null ? null : resident.getRoom().getFloor(),
                resident.isActive(),
                resident.getPhotoUrl(),
                resident.getDistinguishingFeatures(),
                allergies,
                dietaryRegimes);
    }
}
