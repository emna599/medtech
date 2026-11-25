package com.esigelec.ehpad_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "medical_records")
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Un dossier médical appartient à un seul résident
    @OneToOne
    @JoinColumn(name = "resident_id", nullable = false, unique = true)
    private Resident resident;

    @Column(columnDefinition = "TEXT")
    private String history;

    @Column(columnDefinition = "TEXT")
    private String treatments;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    private void toucherDateMiseAJour() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Resident getResident() { return resident; }
    public void setResident(Resident resident) { this.resident = resident; }

    public String getHistory() { return history; }
    public void setHistory(String history) { this.history = history; }

    public String getTreatments() { return treatments; }
    public void setTreatments(String treatments) { this.treatments = treatments; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}