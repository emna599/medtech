package com.esigelec.ehpad_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** Chevalet (numéro posé sur la table ou le plateau) : libre, ou associé à un résident. */
@Entity
@Table(name = "chevalet")
public class Chevalet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resident_id")
    private Resident resident;

    @Column(name = "associated_at")
    private LocalDateTime associatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "associated_by")
    private User associatedBy;

    protected Chevalet() {
    }

    public Chevalet(String code) {
        this.code = code;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }

    public Resident getResident() { return resident; }
    public void setResident(Resident resident) { this.resident = resident; }

    public LocalDateTime getAssociatedAt() { return associatedAt; }
    public void setAssociatedAt(LocalDateTime associatedAt) { this.associatedAt = associatedAt; }

    public User getAssociatedBy() { return associatedBy; }
    public void setAssociatedBy(User associatedBy) { this.associatedBy = associatedBy; }
}
