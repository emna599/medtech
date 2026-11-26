package com.esigelec.ehpad_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** Présence réelle d'un résident à une table, d'après la lecture de son bracelet (left_at vide = encore assis). */
@Entity
@Table(name = "table_presence")
public class TablePresence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resident_id", nullable = false)
    private Long residentId;

    @Column(name = "table_id", nullable = false)
    private Long tableId;

    @Column(name = "arrived_at", nullable = false)
    private LocalDateTime arrivedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    protected TablePresence() {
    }

    public TablePresence(Long residentId, Long tableId) {
        this.residentId = residentId;
        this.tableId = tableId;
        this.arrivedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getResidentId() { return residentId; }
    public Long getTableId() { return tableId; }
    public LocalDateTime getArrivedAt() { return arrivedAt; }
    public LocalDateTime getLeftAt() { return leftAt; }
    public void setLeftAt(LocalDateTime leftAt) { this.leftAt = leftAt; }
}
