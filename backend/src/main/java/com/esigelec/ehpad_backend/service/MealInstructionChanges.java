package com.esigelec.ehpad_backend.service;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

@Repository
public class MealInstructionChanges {
    private final NamedParameterJdbcTemplate jdbc;

    public MealInstructionChanges(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void record(Long residentId) {
        jdbc.update("""
                insert into meal_instruction_change (resident_id, changed_at)
                values (:residentId, statement_timestamp())
                on conflict (resident_id) do update set changed_at = excluded.changed_at
                """, Map.of("residentId", residentId));
    }

    public Map<Long, OffsetDateTime> todayFor(Collection<Long> residents) {
        return jdbc.query("""
                select resident_id, changed_at from meal_instruction_change
                where resident_id in (:residents) and changed_at >= current_date
                """, Map.of("residents", residents), rows -> {
            Map<Long, OffsetDateTime> changes = new HashMap<>();
            while (rows.next()) {
                changes.put(rows.getLong("resident_id"), rows.getObject("changed_at", OffsetDateTime.class));
            }
            return changes;
        });
    }
}
