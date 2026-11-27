package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.dto.HandoverActionDto;
import com.esigelec.ehpad_backend.entity.Shift;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class HandoverRepository {
    private static final String SELECT_ACTION = """
            select h.*, concat_ws(' ', r.first_name, r.last_name) as resident_name,
                   author.full_name as author_name, closer.full_name as closer_name, assignee.full_name as assignee_name
            from handover_action h
            join users author on author.id = h.created_by
            left join resident r on r.id = h.resident_id
            left join users closer on closer.id = h.completed_by
            left join users assignee on assignee.id = h.assigned_to
            """;
    private static final RowMapper<HandoverActionDto> MAPPER = (row, index) -> {
        Long residentId = row.getObject("resident_id", Long.class);
        String shift = row.getString("target_shift");
        return new HandoverActionDto(
                row.getLong("id"), residentId, residentId == null ? null : row.getString("resident_name"),
                row.getString("observation"), row.getString("expected_action"), row.getString("author_name"),
                row.getObject("created_at", OffsetDateTime.class),
                row.getObject("assigned_to", Long.class), row.getString("assignee_name"),
                row.getLong("assignment_version"), row.getString("closer_name"),
                row.getObject("completed_at", OffsetDateTime.class), shift == null ? null : Shift.valueOf(shift));
    };

    private final JdbcTemplate jdbc;

    public HandoverRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<HandoverActionDto> listOpen(long userId, Shift shift) {
        return jdbc.query(SELECT_ACTION + " where h.completed_at is null"
                + " and (h.target_shift is null or h.target_shift = ? or h.created_by = ?)"
                + " order by h.created_at, h.id", MAPPER, shift.name(), userId);
    }

    public List<HandoverActionDto> listRecentlyCompleted(long userId, Shift shift) {
        return jdbc.query(SELECT_ACTION + " where h.completed_at is not null"
                + " and (h.target_shift is null or h.target_shift = ? or h.created_by = ?)"
                + " order by h.completed_at desc, h.id desc limit 30", MAPPER, shift.name(), userId);
    }

    public Optional<HandoverActionDto> find(long id) {
        return jdbc.query(SELECT_ACTION + " where h.id = ?", MAPPER, id).stream().findFirst();
    }

    public Optional<HandoverActionDto> findByRequest(long userId, UUID requestId) {
        return jdbc.query(SELECT_ACTION + " where h.created_by = ? and h.request_id = ?",
                MAPPER, userId, requestId).stream().findFirst();
    }

    public Optional<Long> insert(long userId, UUID requestId, Long residentId, String observation, String action, Shift shift) {
        return jdbc.query("""
                insert into handover_action (created_by, request_id, resident_id, observation, expected_action, target_shift)
                values (?, ?, ?, ?, ?, ?)
                on conflict (created_by, request_id) do nothing
                returning id
                """, (row, index) -> row.getLong("id"), userId, requestId, residentId, observation, action, shift == null ? null : shift.name())
                .stream().findFirst();
    }

    public boolean assign(long id, Long assignee, long expectedVersion) {
        return jdbc.update("""
                update handover_action set assigned_to = ?, assignment_version = assignment_version + 1
                where id = ? and assignment_version = ? and completed_at is null
                """, assignee, id, expectedVersion) == 1;
    }

    public boolean complete(long id, long userId, long version) {
        return jdbc.update("""
                update handover_action set completed_by = ?, completed_at = statement_timestamp()
                where id = ? and completed_at is null and assigned_to = ? and assignment_version = ?
                """, userId, id, userId, version) == 1;
    }
}
