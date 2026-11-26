package com.esigelec.ehpad_backend.mapper;

import com.esigelec.ehpad_backend.dto.DietaryRegimeDto;
import com.esigelec.ehpad_backend.dto.DietaryRegimeRequestDto;
import com.esigelec.ehpad_backend.entity.DietaryRegime;
import com.esigelec.ehpad_backend.entity.Resident;

public final class DietaryRegimeMapper {

    private DietaryRegimeMapper() {
    }

    public static DietaryRegimeDto toDto(DietaryRegime regime) {
        return new DietaryRegimeDto(
                regime.getId(),
                regime.getType(),
                regime.getTexture(),
                regime.getRestrictions(),
                regime.getIntolerances(),
                regime.getInstructions(), regime.getVersion());
    }

    public static DietaryRegime toEntity(DietaryRegimeRequestDto request, Resident resident) {
        DietaryRegime regime = new DietaryRegime();
        updateEntity(regime, request);
        regime.setResident(resident);
        return regime;
    }

    public static void updateEntity(DietaryRegime regime, DietaryRegimeRequestDto request) {
        regime.setType(request.type());
        regime.setTexture(request.texture());
        regime.setRestrictions(request.restrictions());
        regime.setIntolerances(request.intolerances());
        regime.setInstructions(request.instructions());
    }
}
