package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AllergyDto;
import com.esigelec.ehpad_backend.dto.AppetiteDto;
import com.esigelec.ehpad_backend.dto.AssistantReply;
import com.esigelec.ehpad_backend.dto.AssistantReply.PendingAction;
import com.esigelec.ehpad_backend.dto.AssistantReply.ResidentRef;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.dto.ServiceItemDto;
import com.esigelec.ehpad_backend.dto.ServiceKind;
import com.esigelec.ehpad_backend.entity.MealLocation;
import com.esigelec.ehpad_backend.entity.ServiceStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Assistant « MedTech Assist » : comprend quelques questions courantes par règles (mots-clés),
 * sans modèle externe. Il ne voit que ce que voit déjà le soignant (fiche PERSONNEL et service du jour),
 * jamais l'historique médical, et ne modifie rien : il propose, le soignant confirme.
 */
@Service
public class AssistantService {

    private static final Set<ServiceStatus> PENDING = EnumSet.of(ServiceStatus.A_FAIRE, ServiceStatus.PLUS_TARD);
    private static final int MAX_LISTED = 12;

    private static final String HELP = """
            Je peux vous aider pour : \
            « qui n'a pas encore mangé ? », « quels médicaments restent à donner ? », \
            « allergies de Mme Martin », « régime de M. Durand », « où est Mme Petit ? », \
            « qui a refusé ? », « résumé du service ». \
            Je peux aussi préparer « marque le repas de M. Durand comme servi » : vous confirmez ensuite.""";

    private final ResidentService residentService;
    private final CareService careService;
    private final AppetiteService appetiteService;

    public AssistantService(ResidentService residentService, CareService careService, AppetiteService appetiteService) {
        this.residentService = residentService;
        this.careService = careService;
        this.appetiteService = appetiteService;
    }

    @Transactional(readOnly = true)
    public AssistantReply answer(String message) {
        String text = normalize(message);
        List<ResidentCardDto> residents = residentService.list(null);
        List<ResidentCardDto> mentioned = findMentioned(text, residents);

        boolean medication = containsAny(text, "medicament", "medic", "dose", "prise", "pilule", "traitement", "cachet");

        if (containsAny(text, "marque", "valide", "note", "enregistre") && containsAny(text, "servi", "donne", "fait", "pris")) {
            return propose(text, mentioned, medication);
        }
        if (containsAny(text, "allergi")) {
            return allergies(mentioned, residents);
        }
        if (containsAny(text, "appetit", "mange moins", "mange mieux", "tendance")) {
            return appetite(mentioned);
        }
        if (containsAny(text, "regime", "texture", "mixe", "hache", "diabet", "sans sel")) {
            return regime(mentioned);
        }
        if (containsAny(text, "ou est", "chambre", "ou se trouve", "etage")) {
            return where(mentioned);
        }
        if (containsAny(text, "refus")) {
            return refused();
        }
        if (containsAny(text, "resume", "releve", "bilan", "point sur", "recap")) {
            return summary();
        }
        if (containsAny(text, "reste", "pas encore", "pas mange", "n'a pas", "a servir", "a donner", "en retard", "attente")) {
            return medication ? remaining(ServiceKind.MEDICAMENT) : remaining(ServiceKind.REPAS);
        }
        if (mentioned.size() == 1) {
            return card(mentioned.get(0));
        }
        return reply(HELP, "AIDE");
    }

    // ------------------------------------------------------------------ intentions

    private AssistantReply remaining(ServiceKind kind) {
        List<ServiceItemDto> all = careService.listToday(kind);
        String slot = currentSlot(all);
        List<ServiceItemDto> todo = all.stream()
                .filter(item -> item.slot().equals(slot) && PENDING.contains(item.status()))
                .toList();
        String what = kind == ServiceKind.REPAS ? "repas à servir" : "prises à donner";
        if (slot == null || todo.isEmpty()) {
            return reply("Rien en attente : tout est fait pour ce service. Bravo !", "RESTE_" + kind);
        }
        List<ResidentRef> refs = todo.stream().limit(MAX_LISTED).map(item -> ref(item.resident())).toList();
        String names = todo.stream().limit(MAX_LISTED).map(this::lineOf).collect(Collectors.joining(" ; "));
        String more = todo.size() > MAX_LISTED ? " … et " + (todo.size() - MAX_LISTED) + " autres." : "";
        return new AssistantReply(todo.size() + " " + what + " (" + slotText(slot) + ") : " + names + "." + more,
                "RESTE_" + kind, refs, null);
    }

    private AssistantReply allergies(List<ResidentCardDto> mentioned, List<ResidentCardDto> residents) {
        if (mentioned.size() > 1) {
            return ambiguous(mentioned);
        }
        if (mentioned.size() == 1) {
            ResidentCardDto r = mentioned.get(0);
            if (r.allergies().isEmpty()) {
                return new AssistantReply(name(r) + " n'a aucune allergie connue.", "ALLERGIES", List.of(ref(r)), null);
            }
            return new AssistantReply("⚠ Allergies de " + name(r) + " : " + allergyText(r) + ".", "ALLERGIES",
                    List.of(ref(r)), null);
        }
        List<ResidentCardDto> withAllergy = residents.stream().filter(r -> !r.allergies().isEmpty()).toList();
        if (withAllergy.isEmpty()) {
            return reply("Aucun résident n'a d'allergie enregistrée.", "ALLERGIES");
        }
        String lines = withAllergy.stream().limit(MAX_LISTED)
                .map(r -> name(r) + " (" + allergyText(r) + ")").collect(Collectors.joining(" ; "));
        return new AssistantReply("Résidents avec allergie : " + lines + ".", "ALLERGIES",
                withAllergy.stream().limit(MAX_LISTED).map(this::ref).toList(), null);
    }

    private AssistantReply appetite(List<ResidentCardDto> mentioned) {
        if (mentioned.isEmpty()) {
            return reply("De quel résident parlez-vous ? Par exemple : « appétit de Mme Martin ».", "APPETIT");
        }
        if (mentioned.size() > 1) {
            return ambiguous(mentioned);
        }
        ResidentCardDto r = mentioned.get(0);
        AppetiteDto appetite = appetiteService.forResident(r.id(), 7);
        if (appetite.recentAverage() == null) {
            return new AssistantReply("Pas assez de repas enregistrés pour " + name(r) + ".", "APPETIT",
                    List.of(ref(r)), null);
        }
        long percent = Math.round(appetite.recentAverage() * 100);
        String verdict = appetite.declining()
                ? "⚠ appétit en baisse : à signaler à l'équipe et au médecin si cela continue."
                : "appétit stable.";
        return new AssistantReply(name(r) + " : environ " + percent + " % des repas mangés ces derniers jours, "
                + verdict, "APPETIT", List.of(ref(r)), null);
    }

    private AssistantReply regime(List<ResidentCardDto> mentioned) {
        if (mentioned.isEmpty()) {
            return reply("De quel résident parlez-vous ? Par exemple : « régime de M. Durand ».", "REGIME");
        }
        if (mentioned.size() > 1) {
            return ambiguous(mentioned);
        }
        ResidentCardDto r = mentioned.get(0);
        List<String> parts = new ArrayList<>();
        parts.add("Régime : " + orDefault(r.regime(), "normal"));
        parts.add("texture : " + orDefault(r.texture(), "normale"));
        if (notBlank(r.restrictions())) {
            parts.add("restrictions : " + r.restrictions());
        }
        if (notBlank(r.instructions())) {
            parts.add("consignes : " + r.instructions());
        }
        if (r.needsHelp()) {
            parts.add("a besoin d'aide pour manger");
        }
        String allergy = r.allergies().isEmpty() ? "" : " ⚠ Allergies : " + allergyText(r) + ".";
        return new AssistantReply(name(r) + " — " + String.join(", ", parts) + "." + allergy, "REGIME",
                List.of(ref(r)), null);
    }

    private AssistantReply where(List<ResidentCardDto> mentioned) {
        if (mentioned.isEmpty()) {
            return reply("Quel résident cherchez-vous ? Par exemple : « où est Mme Petit ? ».", "OU");
        }
        if (mentioned.size() > 1) {
            return ambiguous(mentioned);
        }
        ResidentCardDto r = mentioned.get(0);
        String room = r.room() == null ? "sans chambre attribuée" : "chambre " + r.room()
                + (r.floor() == null ? "" : " (étage " + r.floor() + ")");
        String meals = r.mealLocation() == MealLocation.CHAMBRE ? "mange dans sa chambre" : "mange en salle à manger";
        return new AssistantReply(name(r) + " : " + room + ", " + meals + ".", "OU", List.of(ref(r)), null);
    }

    private AssistantReply refused() {
        List<ServiceItemDto> items = new ArrayList<>(careService.listToday(ServiceKind.REPAS));
        items.addAll(careService.listToday(ServiceKind.MEDICAMENT));
        List<ServiceItemDto> refused = items.stream().filter(i -> i.status() == ServiceStatus.REFUSE).toList();
        if (refused.isEmpty()) {
            return reply("Aucun refus enregistré aujourd'hui.", "REFUS");
        }
        String lines = refused.stream().map(i -> name(i.resident()) + " (" + i.label() + ")")
                .collect(Collectors.joining(" ; "));
        return new AssistantReply(refused.size() + " refus aujourd'hui : " + lines + ".", "REFUS",
                refused.stream().map(i -> ref(i.resident())).distinct().toList(), null);
    }

    private AssistantReply summary() {
        List<ServiceItemDto> meals = careService.listToday(ServiceKind.REPAS);
        List<ServiceItemDto> doses = careService.listToday(ServiceKind.MEDICAMENT);
        String slot = currentSlot(meals);
        List<ServiceItemDto> mealsNow = meals.stream().filter(i -> i.slot().equals(slot)).toList();
        long mealsDone = mealsNow.stream().filter(i -> i.status() == ServiceStatus.FAIT).count();
        long dosesDone = doses.stream().filter(i -> i.status() == ServiceStatus.FAIT).count();
        long refusals = meals.stream().filter(i -> i.status() == ServiceStatus.REFUSE).count()
                + doses.stream().filter(i -> i.status() == ServiceStatus.REFUSE).count();
        long later = meals.stream().filter(i -> i.status() == ServiceStatus.PLUS_TARD).count()
                + doses.stream().filter(i -> i.status() == ServiceStatus.PLUS_TARD).count();
        long highRiskPending = doses.stream().filter(i -> i.highRisk() && PENDING.contains(i.status())).count();
        String when = slot == null ? "" : " (" + slotText(slot) + ")";
        StringBuilder sb = new StringBuilder("Résumé : ");
        sb.append(mealsDone).append("/").append(mealsNow.size()).append(" repas servis").append(when).append(", ");
        sb.append(dosesDone).append("/").append(doses.size()).append(" prises données, ");
        sb.append(refusals).append(" refus, ").append(later).append(" reporté(s).");
        if (highRiskPending > 0) {
            sb.append(" ⚠ ").append(highRiskPending).append(" prise(s) à risque encore à donner.");
        }
        return reply(sb.toString(), "RESUME");
    }

    /** Prépare une validation. Rien n'est enregistré avant la confirmation du soignant. */
    private AssistantReply propose(String text, List<ResidentCardDto> mentioned, boolean medication) {
        if (mentioned.isEmpty()) {
            return reply("Pour quel résident ? Par exemple : « marque le repas de M. Durand comme servi ».", "ACTION");
        }
        if (mentioned.size() > 1) {
            return ambiguous(mentioned);
        }
        ResidentCardDto r = mentioned.get(0);
        if (r.identityDoubt()) {
            return new AssistantReply("Doute d'identité en cours pour " + name(r)
                    + " : un autre soignant doit d'abord le confirmer. Je ne peux rien valider.", "ACTION",
                    List.of(ref(r)), null);
        }
        ServiceKind kind = medication ? ServiceKind.MEDICAMENT : ServiceKind.REPAS;
        List<ServiceItemDto> items = careService.listToday(kind).stream()
                .filter(i -> i.resident().id().equals(r.id()) && PENDING.contains(i.status()))
                .sorted(Comparator.comparing(ServiceItemDto::scheduledAt))
                .toList();
        if (items.isEmpty()) {
            return new AssistantReply("Rien à faire pour " + name(r) + " (" + (medication ? "médicaments" : "repas")
                    + ") : c'est déjà fait ou refusé.", "ACTION", List.of(ref(r)), null);
        }
        ServiceItemDto item = items.get(0);
        String verb = medication ? "donné" : "servi";
        String summary = item.label() + " de " + name(r) + " → " + verb;
        return new AssistantReply("Je prépare : " + summary + ". Confirmez-vous ?", "ACTION", List.of(ref(r)),
                new PendingAction(kind, item.id(), summary));
    }

    private AssistantReply card(ResidentCardDto r) {
        String room = r.room() == null ? "sans chambre" : "chambre " + r.room();
        String allergy = r.allergies().isEmpty() ? "pas d'allergie connue" : "⚠ allergies : " + allergyText(r);
        return new AssistantReply(name(r) + " — " + room + ", " + orDefault(r.regime(), "régime normal")
                + ", texture " + orDefault(r.texture(), "normale") + ", " + allergy + ".", "FICHE",
                List.of(ref(r)), null);
    }

    private AssistantReply ambiguous(List<ResidentCardDto> candidates) {
        String names = candidates.stream().limit(5).map(this::name).collect(Collectors.joining(", "));
        return new AssistantReply("Plusieurs résidents correspondent : " + names + ". Précisez le prénom.",
                "AMBIGU", candidates.stream().limit(5).map(this::ref).toList(), null);
    }

    // ------------------------------------------------------------------ utilitaires

    private AssistantReply reply(String answer, String intent) {
        return new AssistantReply(answer, intent, List.of(), null);
    }

    private ResidentRef ref(ResidentCardDto r) {
        return new ResidentRef(r.id(), name(r), r.room());
    }

    private String name(ResidentCardDto r) {
        return r.firstName() + " " + r.lastName().toUpperCase(Locale.ROOT);
    }

    private String lineOf(ServiceItemDto item) {
        ResidentCardDto r = item.resident();
        String room = r.room() == null ? "" : " (ch. " + r.room() + ")";
        return name(r) + room;
    }

    private String allergyText(ResidentCardDto r) {
        return r.allergies().stream().map(AllergyDto::name).collect(Collectors.joining(", "));
    }

    /** Créneau en cours : celui du premier élément encore à faire, sinon le premier de la journée. */
    private String currentSlot(List<ServiceItemDto> items) {
        return items.stream()
                .sorted(Comparator.comparing(ServiceItemDto::scheduledAt))
                .filter(i -> PENDING.contains(i.status()))
                .map(ServiceItemDto::slot)
                .findFirst()
                .orElseGet(() -> items.stream()
                        .min(Comparator.comparing(ServiceItemDto::scheduledAt))
                        .map(ServiceItemDto::slot)
                        .orElse(null));
    }

    private String slotText(String slot) {
        return switch (slot) {
            case "PETIT_DEJEUNER" -> "petit-déjeuner";
            case "DEJEUNER" -> "déjeuner";
            case "DINER" -> "dîner";
            case "MATIN" -> "matin";
            case "MIDI" -> "midi";
            case "SOIR" -> "soir";
            default -> slot.toLowerCase(Locale.ROOT);
        };
    }

    private List<ResidentCardDto> findMentioned(String text, List<ResidentCardDto> residents) {
        Set<String> tokens = new HashSet<>();
        for (String token : text.split("[^a-z]+")) {
            if (token.length() >= 3) {
                tokens.add(token);
            }
        }
        return residents.stream()
                .filter(r -> tokens.contains(normalize(r.lastName())) || tokens.contains(normalize(r.firstName())))
                .toList();
    }

    private static boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private static String orDefault(String value, String fallback) {
        return notBlank(value) ? value : fallback;
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('’', '\'')
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
