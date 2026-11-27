package com.esigelec.ehpad_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "resident")
public class Resident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(name = "admission_date", nullable = false)
    private LocalDate admissionDate;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(name = "photo_url", length = 255)
    private String photoUrl;

    @Column(name = "distinguishing_features", length = 255)
    private String distinguishingFeatures;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_location", nullable = false, length = 20)
    private MealLocation mealLocation = MealLocation.SALLE;

    @Column(name = "needs_help", nullable = false)
    private boolean needsHelp;

    /** Identifiant anonyme (contenu d'un éventuel QR de bracelet) : jamais de donnée de santé. */
    @Column(name = "identity_code", length = 50)
    private String identityCode;

    public Long getId() { return id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public LocalDate getAdmissionDate() { return admissionDate; }
    public void setAdmissionDate(LocalDate admissionDate) { this.admissionDate = admissionDate; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getDistinguishingFeatures() { return distinguishingFeatures; }
    public void setDistinguishingFeatures(String distinguishingFeatures) { this.distinguishingFeatures = distinguishingFeatures; }

    public MealLocation getMealLocation() { return mealLocation; }
    public void setMealLocation(MealLocation mealLocation) { this.mealLocation = mealLocation; }

    public boolean isNeedsHelp() { return needsHelp; }
    public void setNeedsHelp(boolean needsHelp) { this.needsHelp = needsHelp; }

    public String getIdentityCode() { return identityCode; }
    public void setIdentityCode(String identityCode) { this.identityCode = identityCode; }
}
