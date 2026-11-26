package com.esigelec.ehpad_backend.dto;

/** Un repas du menu : jour (1 = lundi ... 7 = dimanche), repas et plats. */
public record MenuEntryDto(int dayOfWeek, String mealType, String starter, String mainCourse, String side, String dessert) {
}
