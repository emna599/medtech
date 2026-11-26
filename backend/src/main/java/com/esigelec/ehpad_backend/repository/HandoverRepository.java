package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.dto.HandoverActionDto;
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
                   author.full_name as author_name, closer.full_name as closer_name
            from handover_action h
            join users author on author.id = h.created_by
            left join resident r on r.id = h.resident_id
            left join users closer on closer.id = h.completed_by
            """;
    private static final RowMapper<HandoverActionDto> MAPPER = (row, index) -> {
        Long residentId = row.getObject("resident_id", Long.class);
        return new HandoverActionDto(
                row.getLong("id"), residentId, residentId == null ? null : row.getString("resident_name"),
                row.getString("observation"), row.getString("expected_action"), row.getString("author_name"),
                row.getObject("created_at", OffsetDateTime.class), row.getString("closer_name"),
                row.getObject("completed_at", OffsetDateTime.class));
    };

    private final JdbcTemplate jdbc;

    public HandoverRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<HandoverActionDto> listOpen() {
        return jdbc.query(SELECT_ACTION + " where h.completed_at is null order by h.created_at, h.id", MAPPER);
    }

    public List<HandoverActionDto> listRecentlyCompleted() {
        return jdbc.query(SELECT_ACTION + " where h.completed_at is not null"
                + " order by h.completed_at desc, h.id desc limit 30", MAPPER);
    }

    public Optional<HandoverActionDto> find(long id) {
        return jdbc.query(SELECT_ACTION + " where h.id = ?", MAPPER, id).stream().findFirst();
    }

    public Optional<HandoverActionDto> findByRequest(long userId, UUID requestId) {
        return jdbc.query(SELECT_ACTION + " where h.created_by = ? and h.request_id = ?",
                MAPPER, userId, requestId).stream().findFirst();
    }

    public Optional<Long> insert(long userId, UUID requestId, Long residentId, String observation, String action) {
        return jdbc.query("""
                insert into handover_action (created_by, request_id, resident_id, observation, expected_action)
                values (?, ?, ?, ?, ?)
                on conflict (created_by, request_id) do nothing
                returning id
                """, (row, index) -> row.getLong("id"), userId, requestId, residentId, observation, action)
                .stream().findFirst();
    }

    public boolean complete(long id, long userId) {
        return jdbc.update("""
                update handover_action set completed_by = ?, completed_at = statement_timestamp()
                where id = ? and completed_at is null
                """, userId, id) == 1;
    }
}
