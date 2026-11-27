package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AllergyDto;
import com.esigelec.ehpad_backend.dto.DiningDto;
import com.esigelec.ehpad_backend.dto.MenuEntryDto;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Compare le menu du repas aux allergies, au régime et à la texture d'un résident.
 * Règles volontairement simples (mots-clés des plats) : une aide pour le service, pas un avis médical.
 * STOP = allergie (ne pas servir), ADAPT = régime ou texture (adapter le plat).
 */
final class MenuCompatibility {

    static final String STOP = "STOP";
    static final String ADAPT = "ADAPT";

    private static final Map<String, List<String>> ALLERGENS = new LinkedHashMap<>();
    private static final List<String> SALTY = List.of("jambon", "quiche", "pizza", "croque", "terrine", "fromage", "frites", "saucisse", "charcuterie");
    private static final List<String> SUGARY = List.of("gateau", "tarte", "flan", "caramel", "mousse", "compote", "aux fruits");
    private static final List<String> MEAT_FISH = List.of("poulet", "porc", "boeuf", "jambon", "dinde", "agneau", "gigot", "escalope",
            "roti", "saucisse", "bourguignon", "poisson", "lardon");
    private static final List<String> HARD = List.of("frites", "pane", "croque", "pizza", "quiche", "salade", "tarte", "crudite");
    private static final Pattern SALT = Pattern.compile("\\bsel\\b");

    static {
        ALLERGENS.put("gluten", List.of("pate", "macaroni", "semoule", "pane", "pain", "croque", "pizza", "quiche", "tarte", "gateau", "vermicelle", "couscous"));
        ALLERGENS.put("lactose", List.of("fromage", "creme", "yaourt", "flan", "gratin", "lait", "mousse", "bechamel", "quiche", "croque", "pizza"));
        ALLERGENS.put("poisson", List.of("poisson", "saumon", "thon", "cabillaud"));
        ALLERGENS.put("fruits de mer", List.of("crevette", "moule", "fruits de mer", "crabe"));
        ALLERGENS.put("arachide", List.of("arachide", "cacahuete"));
        ALLERGENS.put("fruits a coque", List.of("noix", "noisette", "amande", "pistache"));
        ALLERGENS.put("oeuf", List.of("oeuf", "omelette", "mayonnaise", "quiche", "flan", "mousse", "creme caramel"));
    }

    private MenuCompatibility() {
    }

    static String normalize(String text) {
        if (text == null) {
            return "";
        }
        String flat = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return flat.toLowerCase(Locale.ROOT).replace("\u0153", "oe").trim();
    }

    private static boolean contains(String dish, List<String> words) {
        return words.stream().anyMatch(dish::contains);
    }

    /** Alertes du menu pour ce résident (liste vide si tout lui convient ou si aucun menu n'est saisi). */
    static List<DiningDto.Warning> check(MenuEntryDto menu, ResidentCardDto resident) {
        List<DiningDto.Warning> warnings = new ArrayList<>();
        if (menu == null) {
            return warnings;
        }
        for (String dishName : new String[] {menu.starter(), menu.mainCourse(), menu.side(), menu.dessert()}) {
            if (dishName == null || dishName.isBlank()) {
                continue;
            }
            String dish = normalize(dishName);

            for (AllergyDto allergy : resident.allergies()) {
                String name = normalize(allergy.name());
                for (Map.Entry<String, List<String>> allergen : ALLERGENS.entrySet()) {
                    if (name.contains(allergen.getKey()) && contains(dish, allergen.getValue())) {
                        add(warnings, dishName, "Allergie : " + allergy.name(), STOP);
                    }
                }
            }

            String diet = normalize(String.join(" ", nullToEmpty(resident.regime()), nullToEmpty(resident.restrictions())));
            if (SALT.matcher(diet).find() && contains(dish, SALTY)) {
                add(warnings, dishName, "Sans sel", ADAPT);
            }
            if (diet.contains("sucre") && contains(dish, SUGARY)) {
                add(warnings, dishName, "Sans sucre", ADAPT);
            }
            if (diet.contains("viande") && contains(dish, MEAT_FISH)) {
                add(warnings, dishName, "Végétarien", ADAPT);
            }

            String texture = normalize(resident.texture());
            if (texture.startsWith("mix") && contains(dish, HARD)) {
                add(warnings, dishName, "À mixer", ADAPT);
            } else if (texture.startsWith("hach") && contains(dish, HARD)) {
                add(warnings, dishName, "À hacher", ADAPT);
            }
        }
        return warnings;
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static void add(List<DiningDto.Warning> warnings, String dish, String reason, String level) {
        boolean exists = warnings.stream().anyMatch(w -> w.dish().equals(dish) && w.reason().equals(reason));
        if (!exists) {
            warnings.add(new DiningDto.Warning(dish, reason, level));
        }
    }
}
