package com.esigelec.ehpad_backend.mapper;

import com.esigelec.ehpad_backend.dto.MedicalAllergyDto;
import com.esigelec.ehpad_backend.dto.AllergyRequestDto;
import com.esigelec.ehpad_backend.entity.Allergy;
import com.esigelec.ehpad_backend.entity.Resident;

public final class AllergyMapper {

    private AllergyMapper() {
    }

    public static MedicalAllergyDto toDto(Allergy allergy) {
        return new MedicalAllergyDto(allergy.getId(), allergy.getName(), allergy.getSeverity());
    }

    public static Allergy toEntity(AllergyRequestDto request, Resident resident) {
        Allergy allergy = new Allergy();
        allergy.setName(request.name());
        allergy.setSeverity(request.severity());
        allergy.setResident(resident);
        return allergy;
    }

    public static void updateEntity(Allergy allergy, AllergyRequestDto request) {
        allergy.setName(request.name());
        allergy.setSeverity(request.severity());
    }
}
