package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.MeDto;
import com.esigelec.ehpad_backend.dto.PlanningDto;
import com.esigelec.ehpad_backend.entity.Job;
import com.esigelec.ehpad_backend.entity.PlanningTask;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.Shift;
import com.esigelec.ehpad_backend.entity.StaffProfile;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.exception.ForbiddenException;
import com.esigelec.ehpad_backend.repository.PlanningTaskRepository;
import com.esigelec.ehpad_backend.repository.StaffProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

/**
 * Fonction (infirmier / aide-soignant), droits et planning type d'un soignant.
 * Sans ligne dans staff_profile : un compte PERSONNEL est traité comme aide-soignant, ADMIN a tous les droits.
 */
@Service
public class StaffService {

    private static final LocalTime NOON = LocalTime.NOON;

    private final CurrentUserService currentUserService;
    private final StaffProfileRepository profileRepository;
    private final PlanningTaskRepository planningRepository;

    public StaffService(CurrentUserService currentUserService,
                        StaffProfileRepository profileRepository,
                        PlanningTaskRepository planningRepository) {
        this.currentUserService = currentUserService;
        this.profileRepository = profileRepository;
        this.planningRepository = planningRepository;
    }

    @Transactional(readOnly = true)
    public MeDto me(String username) {
        User user = currentUserService.require(username);
        Job job = jobOf(user);
        return new MeDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole(),
                job,
                shiftOf(user),
                canGiveMedication(user),
                user.getRole() == Role.ADMIN);
    }

    /** Refuse l'administration des médicaments à qui n'est pas infirmier (ou administrateur). */
    @Transactional(readOnly = true)
    public void requireMedicationRights(String username) {
        if (!canGiveMedication(currentUserService.require(username))) {
            throw new ForbiddenException("Les médicaments sont réservés aux infirmiers. Appelez l'infirmier de l'équipe.");
        }
    }

    @Transactional(readOnly = true)
    public PlanningDto planning(String username) {
        User user = currentUserService.require(username);
        Job job = jobOf(user);
        Shift shift = shiftOf(user);
        List<PlanningDto.Task> tasks = planningRepository.findByJobAndShift(job, shift).stream()
                .sorted(Comparator.comparing((PlanningTask task) -> sortKey(task, shift)))
                .map(task -> new PlanningDto.Task(
                        task.getStartTime().toString(),
                        task.getEndTime().toString(),
                        task.getLabel(),
                        task.getKind(),
                        task.getFocus()))
                .toList();
        return new PlanningDto(job, shift, tasks);
    }

    public Job jobOf(User user) {
        return profile(user)
                .map(StaffProfile::getJob)
                .orElse(user.getRole() == Role.ADMIN ? Job.INFIRMIER : Job.AIDE_SOIGNANT);
    }

    public Shift shiftOf(User user) {
        return profile(user).map(StaffProfile::getShift).orElse(Shift.JOUR);
    }

    private boolean canGiveMedication(User user) {
        return user.getRole() == Role.ADMIN || jobOf(user) == Job.INFIRMIER;
    }

    private java.util.Optional<StaffProfile> profile(User user) {
        return profileRepository.findById(user.getId());
    }

    /** La nuit commence le soir : les plages après minuit passent après celles de 21 h. */
    private static long sortKey(PlanningTask task, Shift shift) {
        long minutes = task.getStartTime().toSecondOfDay() / 60L;
        return shift == Shift.NUIT && task.getStartTime().isBefore(NOON) ? minutes + 24 * 60 : minutes;
    }
}
