package com.esigelec.ehpad_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

/** Un repas du menu d'une semaine : jour (1 = lundi ... 7 = dimanche), repas (DEJEUNER / DINER) et plats. */
@Entity
@Table(name = "weekly_menu")
public class WeeklyMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Lundi de la semaine concernée. */
    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "day_of_week", nullable = false)
    private int dayOfWeek;

    @Column(name = "meal_type", nullable = false, length = 20)
    private String mealType;

    @Column(length = 150)
    private String starter;

    @Column(name = "main_course", nullable = false, length = 150)
    private String mainCourse;

    @Column(length = 150)
    private String side;

    @Column(length = 150)
    private String dessert;

    protected WeeklyMenu() {
    }

    public Long getId() { return id; }
    public LocalDate getWeekStart() { return weekStart; }
    public int getDayOfWeek() { return dayOfWeek; }
    public String getMealType() { return mealType; }
    public String getStarter() { return starter; }
    public String getMainCourse() { return mainCourse; }
    public String getSide() { return side; }
    public String getDessert() { return dessert; }
}
