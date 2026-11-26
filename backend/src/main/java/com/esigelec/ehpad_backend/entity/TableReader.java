package com.esigelec.ehpad_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Lecteur RFID fixé à une table (TR1, TR2...). */
@Entity
@Table(name = "table_reader")
public class TableReader {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "table_id", nullable = false)
    private Long tableId;

    protected TableReader() {
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public Long getTableId() { return tableId; }
}
