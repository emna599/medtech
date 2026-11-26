package com.esigelec.ehpad_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Table de la salle à manger (8 places au maximum). */
@Entity
@Table(name = "dining_table")
public class DiningTable {

    /** Nombre maximum de résidents par table. */
    public static final int MAX_SEATS = 8;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String label;

    @Column(nullable = false)
    private int capacity;

    protected DiningTable() {
    }

    public Long getId() { return id; }
    public String getLabel() { return label; }
    public int getCapacity() { return capacity; }
}
