package com.esigelec.ehpad_backend.dto;

import com.esigelec.ehpad_backend.entity.Role;

import java.util.List;
import java.util.Map;

/** Chiffres du tableau de bord administrateur. */
public record DashboardStatsDto(
        long activeResidents,
        long inactiveResidents,
        long unassignedResidents,
        long totalRooms,
        long totalBeds,
        long occupiedBeds,
        long freeBeds,
        int occupancyRate,
        long enabledUsers,
        long disabledUsers,
        Map<Role, Long> usersByRole,
        List<FloorStatDto> floors,
        List<ResidentDto> recentAdmissions) {
}
