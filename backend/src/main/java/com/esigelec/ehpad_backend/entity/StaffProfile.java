package com.esigelec.ehpad_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Fonction et équipe d'un soignant (une ligne par utilisateur). */
@Entity
@Table(name = "staff_profile")
public class StaffProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Shift shift;

    public Long getUserId() { return userId; }
    public Job getJob() { return job; }
    public Shift getShift() { return shift; }
}
