package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class ResidentDailyService {
    public record EntryRequest(@NotNull UUID requestId,
                               @DecimalMin(value = "0.01") @Digits(integer = 3, fraction = 2) BigDecimal weightKg,
                               @Size(max = 1000) String observation) {}

    public record PreferencesRequest(@NotNull @Size(max = 600) String preferences,
                                     @NotNull @PositiveOrZero Long version) {}

    public record Preferences(String text, long version) {}

    public record Entry(long id, long residentId, String author, OffsetDateTime recordedAt,
                        BigDecimal weightKg, String observation) {}

    public record DailySummary(Preferences preferences, List<Entry> history) {}

    private static final String ENTRY_SELECT = """
            select e.id, e.resident_id, u.full_name, e.recorded_at, e.weight_kg, e.observation
            from resident_daily_entry e join users u on u.id = e.author_id
            """;
    private final JdbcTemplate jdbc;
    private final ResidentRepository residents;
    private final CurrentUserService users;
    private final AuditService audit;

    public ResidentDailyService(JdbcTemplate jdbc, ResidentRepository residents, CurrentUserService users,
                                AuditService audit) {
        this.jdbc = jdbc;
        this.residents = residents;
        this.users = users;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public DailySummary summary(long id) {
        if (!residents.existsById(id)) throw new ResourceNotFoundException("Résident introuvable");
        return new DailySummary(preferences(id), entries(
                " where e.resident_id = ? order by e.id desc limit 30", id));
    }

    @Transactional
    public Preferences updatePreferences(long id, PreferencesRequest request, String username) {
        lockActive(id);
        Preferences current = preferences(id);
        if (current.version() != request.version()) {
            throw new ConflictException("Les préférences ont changé. Rechargez-les avant de modifier.");
        }
        String text = clean(request.preferences());
        if (current.text().equals(text)) return current;
        long next = current.version() + 1;
        jdbc.update("""
                insert into resident_daily_preferences (resident_id, preferences, version) values (?, ?, ?)
                on conflict (resident_id) do update set preferences = excluded.preferences, version = excluded.version
                """, id, text, next);
        audit.record(users.require(username), "PREFERENCES_QUOTIDIEN_MODIFIEES", "Resident", id);
        return new Preferences(text, next);
    }

    @Transactional
    public Entry addEntry(long id, EntryRequest request, String username) {
        long author = users.require(username).getId();
        String text = clean(request.observation());
        String observation = text.isEmpty() ? null : text;
        BigDecimal weight = request.weightKg() == null ? null : request.weightKg().setScale(2);
        if (observation == null && weight == null) {
            throw new BadRequestException("Saisissez un poids ou une observation.");
        }
        var previous = entries(" where e.author_id = ? and e.request_id = ?", author, request.requestId());
        if (!previous.isEmpty()) return matching(previous.getFirst(), id, weight, observation);

        lockActive(id);
        List<Long> inserted = jdbc.query("""
                insert into resident_daily_entry (resident_id, author_id, request_id, weight_kg, observation)
                values (?, ?, ?, ?, ?) on conflict (author_id, request_id) do nothing returning id
                """, (row, index) -> row.getLong("id"), id, author, request.requestId(), weight, observation);
        if (inserted.isEmpty()) {
            return matching(entries(" where e.author_id = ? and e.request_id = ?", author, request.requestId())
                    .getFirst(), id, weight, observation);
        }
        return entries(" where e.id = ?", inserted.getFirst()).getFirst();
    }

    private List<Entry> entries(String condition, Object... params) {
        return jdbc.query(ENTRY_SELECT + condition, (row, index) ->
                new Entry(row.getLong("id"), row.getLong("resident_id"), row.getString("full_name"),
                        row.getObject("recorded_at", OffsetDateTime.class), row.getBigDecimal("weight_kg"),
                        row.getString("observation")), params);
    }

    private static Entry matching(Entry entry, long id, BigDecimal weight, String observation) {
        if (entry.residentId() != id || !Objects.equals(entry.weightKg(), weight)
                || !Objects.equals(entry.observation(), observation)) {
            throw new ConflictException("Cette saisie a déjà été enregistrée avec un autre contenu.");
        }
        return entry;
    }

    private Preferences preferences(long id) {
        return jdbc.query("select preferences, version from resident_daily_preferences where resident_id = ?",
                (row, index) -> new Preferences(row.getString(1), row.getLong(2)), id)
                .stream().findFirst().orElse(new Preferences("", 0));
    }

    private void lockActive(long id) {
        residents.findByIdForUpdate(id).filter(Resident::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Résident actif introuvable"));
    }

    private static String clean(String text) {
        if (text == null) return "";
        String result = text.replace("\r\n", "\n").strip();
        if (result.codePoints().anyMatch(code -> (Character.isISOControl(code) && code != '\n')
                || (code >= 0x202A && code <= 0x202E) || (code >= 0x2066 && code <= 0x2069))) {
            throw new BadRequestException("Le texte contient des caractères de contrôle.");
        }
        return result.codePoints().allMatch(code -> Character.isWhitespace(code) || Character.isSpaceChar(code)
                || Character.getType(code) == Character.FORMAT) ? "" : result;
    }
}
