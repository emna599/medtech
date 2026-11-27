package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.TeamDto;
import com.esigelec.ehpad_backend.entity.Job;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.StaffPresence;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import com.esigelec.ehpad_backend.repository.StaffPresenceRepository;
import com.esigelec.ehpad_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Qui est en service, et quelle part de résidents revient à chacun.
 * Les résidents, triés par chambre, sont coupés en parts égales entre les soignants présents d'une même fonction :
 * un seul infirmier suit tout le monde, deux infirmiers suivent chacun une moitié.
 */
@Service
public class TeamService {

    /** Au-delà, l'équipe est signalée comme surchargée (repère : 80 résidents pour 2 infirmiers). */
    static final int MAX_PER_NURSE = 40;
    /** Une présence jamais fermée est ignorée après ce délai (oubli de « Je termine mon service »). */
    static final Duration MAX_SHIFT = Duration.ofHours(16);

    private final CurrentUserService currentUserService;
    private final StaffService staffService;
    private final StaffPresenceRepository presenceRepository;
    private final UserRepository userRepository;
    private final ResidentRepository residentRepository;
    private final AuditService auditService;

    public TeamService(CurrentUserService currentUserService,
                       StaffService staffService,
                       StaffPresenceRepository presenceRepository,
                       UserRepository userRepository,
                       ResidentRepository residentRepository,
                       AuditService auditService) {
        this.currentUserService = currentUserService;
        this.staffService = staffService;
        this.presenceRepository = presenceRepository;
        this.userRepository = userRepository;
        this.residentRepository = residentRepository;
        this.auditService = auditService;
    }

    @Transactional
    public TeamDto checkIn(String username) {
        User user = lockCurrentUser(username);
        LocalDateTime now = LocalDateTime.now();
        List<StaffPresence> open = presenceRepository.findByUserIdAndEndedAtIsNull(user.getId());
        if (open.stream().noneMatch(presence -> presence.getStartedAt().isAfter(now.minus(MAX_SHIFT)))) {
            open.forEach(presence -> presence.setEndedAt(now));
            presenceRepository.save(new StaffPresence(user.getId(), now));
            auditService.record(user, "PRISE_DE_SERVICE", "User", user.getId());
        }
        return team(username);
    }

    @Transactional
    public TeamDto checkOut(String username) {
        User user = lockCurrentUser(username);
        List<StaffPresence> open = presenceRepository.findByUserIdAndEndedAtIsNull(user.getId());
        for (StaffPresence presence : open) {
            presence.setEndedAt(LocalDateTime.now());
        }
        if (!open.isEmpty()) {
            auditService.record(user, "FIN_DE_SERVICE", "User", user.getId());
        }
        return team(username);
    }

    private User lockCurrentUser(String username) {
        return userRepository.findByUsernameForUpdate(username)
                .filter(User::isEnabled)
                .orElseThrow(com.esigelec.ehpad_backend.exception.InvalidCredentialsException::new);
    }

    @Transactional(readOnly = true)
    public TeamDto team(String username) {
        User me = currentUserService.require(username);
        Job myJob = staffService.jobOf(me);
        boolean seesAll = myJob == Job.INFIRMIER || me.getRole() == Role.ADMIN;

        List<Resident> residents = new ArrayList<>(residentRepository.findAllActive());
        residents.sort(Comparator.<Resident, String>comparing(TeamService::roomKey).thenComparing(Resident::getId));

        // Une seule présence par soignant, la plus ancienne encore valable.
        Map<Long, LocalDateTime> since = new HashMap<>();
        for (StaffPresence presence : presenceRepository.findByEndedAtIsNullAndStartedAtAfter(LocalDateTime.now().minus(MAX_SHIFT))) {
            since.merge(presence.getUserId(), presence.getStartedAt(), (a, b) -> a.isBefore(b) ? a : b);
        }
        Map<Long, User> users = new HashMap<>();
        userRepository.findAllById(since.keySet()).stream().filter(User::isEnabled)
                .forEach(user -> users.put(user.getId(), user));

        Map<Job, List<User>> byJob = new TreeMap<>();
        for (User user : users.values()) {
            Job job = staffService.jobOf(user);
            if (job != Job.SERVICE && job != Job.CUISINE) {  // le service en salle ne prend pas en charge de résidents
                byJob.computeIfAbsent(job, key -> new ArrayList<>()).add(user);
            }
        }

        List<TeamDto.Member> members = new ArrayList<>();
        List<Long> myIds = new ArrayList<>();
        for (Map.Entry<Job, List<User>> entry : byJob.entrySet()) {
            List<User> group = entry.getValue();
            group.sort(Comparator.comparing(User::getId));
            List<List<Resident>> parts = split(residents, group.size());
            for (int i = 0; i < group.size(); i++) {
                User user = group.get(i);
                List<Resident> part = parts.get(i);
                boolean isMe = user.getId().equals(me.getId());
                if (isMe) {
                    part.forEach(resident -> myIds.add(resident.getId()));
                }
                if (seesAll || entry.getKey() == myJob) {
                    members.add(new TeamDto.Member(
                            user.getId(), user.getFullName(), entry.getKey(), staffService.shiftOf(user),
                            since.get(user.getId()), part.size(), roomRange(part), isMe));
                }
            }
        }

        int nurses = byJob.getOrDefault(Job.INFIRMIER, List.of()).size();
        int aides = byJob.getOrDefault(Job.AIDE_SOIGNANT, List.of()).size();
        return new TeamDto(since.containsKey(me.getId()), myJob, residents.size(), MAX_PER_NURSE, nurses, aides,
                members, myIds, alerts(residents.size(), nurses, aides));
    }

    static List<String> alerts(int residents, int nurses, int aides) {
        List<String> alerts = new ArrayList<>();
        if (nurses == 0) {
            alerts.add("Aucun infirmier n'est en service.");
        } else if ((residents + nurses - 1) / nurses > MAX_PER_NURSE) {
            alerts.add("Plus de " + MAX_PER_NURSE + " résidents par infirmier (" + ((residents + nurses - 1) / nurses) + ").");
        }
        if (aides == 0) {
            alerts.add("Aucune aide-soignante n'est en service.");
        }
        return alerts;
    }

    /** Coupe la liste en `parts` morceaux contigus de tailles presque égales (les premiers prennent le reste). */
    static <T> List<List<T>> split(List<T> items, int parts) {
        List<List<T>> result = new ArrayList<>();
        if (parts <= 0) {
            return result;
        }
        int base = items.size() / parts;
        int extra = items.size() % parts;
        int start = 0;
        for (int i = 0; i < parts; i++) {
            int size = base + (i < extra ? 1 : 0);
            result.add(new ArrayList<>(items.subList(start, start + size)));
            start += size;
        }
        return result;
    }

    /** Ordre des chambres : numéro croissant, sans chambre en dernier. */
    static String roomKey(Resident resident) {
        if (resident.getRoom() == null || resident.getRoom().getNumber() == null) {
            return "~";
        }
        String number = resident.getRoom().getNumber().trim();
        StringBuilder digits = new StringBuilder();
        for (char c : number.toCharArray()) {
            if (Character.isDigit(c)) {
                digits.append(c);
            } else {
                break;
            }
        }
        String padded = digits.length() == 0 ? number : String.format("%06d", Integer.parseInt(digits.toString()));
        return padded + number;
    }

    private static String roomRange(List<Resident> part) {
        List<String> rooms = part.stream()
                .filter(resident -> resident.getRoom() != null && resident.getRoom().getNumber() != null)
                .map(resident -> resident.getRoom().getNumber())
                .toList();
        if (rooms.isEmpty()) {
            return null;
        }
        return rooms.get(0).equals(rooms.get(rooms.size() - 1)) ? rooms.get(0) : rooms.get(0) + " à " + rooms.get(rooms.size() - 1);
    }
}
