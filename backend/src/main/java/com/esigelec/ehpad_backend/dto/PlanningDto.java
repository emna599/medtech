package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.Job;
import com.esigelec.ehpad_backend.entity.Shift;

import java.util.List;

/** Planning type du soignant (fixe), dans l'ordre de l'équipe. */
public record PlanningDto(Job job, Shift shift, List<Task> tasks) {

    /** `kind` : TRANSMISSION, TOURNEE, REPAS, SOINS ou PAUSE. `focus` : REPAS ou MEDICAMENT quand la plage correspond à un service. */
    public record Task(String start, String end, String label, String kind, String focus) {
    }
}
