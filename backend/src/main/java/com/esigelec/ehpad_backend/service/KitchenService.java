package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AllergyDto;
import com.esigelec.ehpad_backend.dto.ServiceItemDto;
import com.esigelec.ehpad_backend.dto.ServiceKind;
import com.esigelec.ehpad_backend.entity.ServiceStatus;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.MealRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
public class KitchenService {
    public enum PlateStatus { A_PREPARER, PREPARE, A_REVERIFIER, CORRIGE }

    public record Plate(long id, String room, String texture, String regime, List<String> allergens,
                        String restrictions, String instructions, boolean textureConflict, String version,
                        PlateStatus status) {}
    private record Check(String version, boolean corrected) {}

    private final JdbcTemplate jdbc;
    private final CareService care;
    private final MealRepository meals;
    private final ResidentRepository residents;
    private final CurrentUserService users;
    private final AuditService audit;

    public KitchenService(JdbcTemplate jdbc, CareService care, MealRepository meals,
                          ResidentRepository residents, CurrentUserService users, AuditService audit) {
        this.jdbc = jdbc;
        this.care = care;
        this.meals = meals;
        this.residents = residents;
        this.users = users;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<Plate> plates(String slot) {
        requireSlot(slot);
        Map<Long, Check> checks = checks();
        String menu = menuVersion(LocalDate.now(), slot);
        return care.listToday(ServiceKind.REPAS).stream().filter(item -> item.slot().equals(slot))
                .filter(KitchenService::pending)
                .map(item -> toPlate(item, checks.get(item.id()), menu)).toList();
    }

    @Transactional(readOnly = true)
    public Map<Long, PlateStatus> statuses(String slot) {
        Map<Long, Check> checks = checks();
        Map<Long, PlateStatus> result = new HashMap<>();
        String menu = menuVersion(LocalDate.now(), slot);
        for (ServiceItemDto item : care.listToday(ServiceKind.REPAS)) {
            if (slot.equals(item.slot())) {
                result.put(item.id(), status(version(item, menu), checks.get(item.id())));
            }
        }
        return result;
    }

    @Transactional
    public Plate check(long id, String expectedVersion, String actor) {
        Long residentId = meals.findResidentId(id).orElseThrow(() -> new ResourceNotFoundException("Plateau introuvable"));
        residents.findByIdForUpdate(residentId).orElseThrow(() -> new ResourceNotFoundException("Plateau introuvable"));
        meals.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Plateau introuvable"));
        ServiceItemDto item = care.listToday(ServiceKind.REPAS).stream()
                .filter(candidate -> candidate.id() == id && pending(candidate)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Plateau à préparer introuvable"));
        String menu = menuVersion(item.scheduledAt().toLocalDate(), item.slot());
        String version = version(item, menu);
        if (!version.equals(expectedVersion)) throw new ConflictException("Les consignes ont changé. Rechargez le plateau.");
        if (item.resident().mealTextureConflict()) throw new ConflictException("Demandez la clarification de la texture.");
        if (item.resident().texture() == null || item.resident().texture().isBlank()
                || item.resident().regime() == null || item.resident().regime().isBlank()) {
            throw new ConflictException("Faites compléter le régime et la texture avant de confirmer.");
        }

        var user = users.require(actor);
        int updated = jdbc.update("""
                insert into kitchen_plate (meal_id, risk_version, checked_by)
                values (?, ?, ?)
                on conflict (meal_id) do update set risk_version = excluded.risk_version, corrected = true,
                    checked_by = excluded.checked_by, checked_at = statement_timestamp()
                where kitchen_plate.risk_version <> excluded.risk_version
                """, id, version, user.getId());
        if (updated > 0) audit.record(user, "CUISINE_PLATEAU_CONFIRME", "Meal", id);
        return toPlate(item, checks().get(id), menu);
    }

    @Transactional
    public void publishMenu(LocalDate date, String slot, String starter, String main, String side, String dessert, String actor) {
        requireSlot(slot);
        Long id = jdbc.queryForObject("""
                insert into weekly_menu (week_start, day_of_week, meal_type, starter, main_course, side, dessert, published_at)
                values (?, ?, ?, ?, ?, ?, ?, statement_timestamp())
                on conflict (week_start, day_of_week, meal_type) do update
                set starter = excluded.starter, main_course = excluded.main_course,
                    side = excluded.side, dessert = excluded.dessert, published_at = excluded.published_at
                returning id
                """, Long.class, DiningService.mondayOf(date), date.getDayOfWeek().getValue(), slot, starter, main.trim(), side, dessert);
        audit.record(users.require(actor), "CUISINE_MENU_PUBLIE", "WeeklyMenu", id);
    }

    private String menuVersion(LocalDate date, String slot) {
        return jdbc.query("""
                select published_at::text from weekly_menu where week_start = ? and day_of_week = ? and meal_type = ?
                """, (row, index) -> row.getString(1), DiningService.mondayOf(date), date.getDayOfWeek().getValue(), slot)
                .stream().filter(java.util.Objects::nonNull).findFirst().orElse("");
    }

    private Map<Long, Check> checks() {
        return jdbc.query("""
                select k.meal_id, k.risk_version, k.corrected from kitchen_plate k
                join meal m on k.meal_id = m.id where m.scheduled_at >= current_date and m.scheduled_at < current_date + 1
                """, rows -> {
            Map<Long, Check> result = new HashMap<>();
            while (rows.next()) result.put(rows.getLong(1), new Check(rows.getString(2), rows.getBoolean(3)));
            return result;
        });
    }

    private static Plate toPlate(ServiceItemDto item, Check check, String menu) {
        var resident = item.resident();
        String version = version(item, menu);
        return new Plate(item.id(), resident.room(), resident.texture(), resident.regime(),
                resident.allergies().stream().map(AllergyDto::name).toList(),
                resident.restrictions(), resident.instructions(), resident.mealTextureConflict(),
                version, status(version, check));
    }

    private static String version(ServiceItemDto item, String menu) {
        var resident = item.resident();
        String value = resident.mealRiskVersion() + ":" + resident.mealInstructionsChangedAt() + ":" + menu;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }

    private static PlateStatus status(String version, Check check) {
        if (check == null) return PlateStatus.A_PREPARER;
        if (!version.equals(check.version())) return PlateStatus.A_REVERIFIER;
        return check.corrected() ? PlateStatus.CORRIGE : PlateStatus.PREPARE;
    }

    private static boolean pending(ServiceItemDto item) {
        return item.status() == ServiceStatus.A_FAIRE || item.status() == ServiceStatus.PLUS_TARD;
    }

    private static void requireSlot(String slot) {
        if (!DiningService.SLOTS.contains(slot)) throw new BadRequestException("Créneau inconnu");
    }
}
