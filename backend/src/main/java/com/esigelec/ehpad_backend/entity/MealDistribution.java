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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** Trace d'un repas servi (ou refusé) : qui, quand, et quelle quantité a été mangée. */
@Entity
@Table(name = "meal_distribution")
public class MealDistribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "served_at", nullable = false)
    private LocalDateTime servedAt;

    @Column(columnDefinition = "text")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "quantity_eaten", length = 20)
    private QuantityEaten quantityEaten;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meal_id", nullable = false, unique = true)
    private Meal meal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Long getId() { return id; }

    public LocalDateTime getServedAt() { return servedAt; }
    public void setServedAt(LocalDateTime servedAt) { this.servedAt = servedAt; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public QuantityEaten getQuantityEaten() { return quantityEaten; }
    public void setQuantityEaten(QuantityEaten quantityEaten) { this.quantityEaten = quantityEaten; }

    public Meal getMeal() { return meal; }
    public void setMeal(Meal meal) { this.meal = meal; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
