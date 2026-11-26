package com.esigelec.ehpad_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** `replace` : confirme qu'on réassigne un chevalet déjà associé à un autre résident. */
public record ChevaletRequest(
        @NotBlank @Size(max = 30) String code,
        @NotNull Long residentId,
        boolean replace
) {
}
