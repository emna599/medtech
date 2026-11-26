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
import jakarta.persistence.Version;

@Entity
@Table(name = "dietary_regime")
public class DietaryRegime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private long version;

    @Column(nullable = false, length = 100)
    private String type;

    @Column(length = 50)
    private String texture;

    @Column(columnDefinition = "text")
    private String restrictions;

    @Column(columnDefinition = "text")
    private String intolerances;

    @Column(columnDefinition = "text")
    private String instructions;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resident_id", nullable = false)
    private Resident resident;

    public Long getId() { return id; }
    public long getVersion() { return version; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTexture() { return texture; }
    public void setTexture(String texture) { this.texture = texture; }

    public String getRestrictions() { return restrictions; }
    public void setRestrictions(String restrictions) { this.restrictions = restrictions; }

    public String getIntolerances() { return intolerances; }
    public void setIntolerances(String intolerances) { this.intolerances = intolerances; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public Resident getResident() { return resident; }
    public void setResident(Resident resident) { this.resident = resident; }
}
