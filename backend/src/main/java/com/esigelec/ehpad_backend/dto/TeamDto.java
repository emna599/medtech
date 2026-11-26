package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.Job;
import com.esigelec.ehpad_backend.entity.Shift;

import java.time.LocalDateTime;
import java.util.List;

/**
 * L'équipe en service et la part de résidents de chacun.
 * Les infirmiers voient toute l'équipe ; les aides-soignants voient leurs collègues aides-soignants.
 */
public record TeamDto(
        boolean present,
        Job myJob,
        int residentTotal,
        int maxPerNurse,
        int nurses,
        int aides,
        List<Member> members,
        List<Long> myResidentIds,
        List<String> alerts
) {

    /** `rooms` : « 3 à 21 » (chambres de sa part) ou null s'il n'a personne. */
    public record Member(
            Long userId,
            String name,
            Job job,
            Shift shift,
            LocalDateTime since,
            int residents,
            String rooms,
            boolean me
    ) {
    }
}
