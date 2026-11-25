package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.DashboardStatsDto;
import com.esigelec.ehpad_backend.dto.FloorStatDto;
import com.esigelec.ehpad_backend.dto.ResidentDto;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.Role;
import com.esigelec.ehpad_backend.entity.Room;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.mapper.ResidentMapper;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import com.esigelec.ehpad_backend.repository.RoomRepository;
import com.esigelec.ehpad_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class DashboardService {

    private final ResidentRepository residentRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public DashboardService(ResidentRepository residentRepository, RoomRepository roomRepository,
                            UserRepository userRepository) {
        this.residentRepository = residentRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto stats() {
        List<Resident> residents = residentRepository.findAllWithRoom();
        List<Room> rooms = roomRepository.findAll();
        List<User> users = userRepository.findAll();

        List<Resident> active = residents.stream().filter(Resident::isActive).toList();
        long unassigned = active.stream().filter(r -> r.getRoom() == null).count();

        Map<Long, Long> occupancyByRoom = new HashMap<>();
        for (Resident r : active) {
            if (r.getRoom() != null) {
                occupancyByRoom.merge(r.getRoom().getId(), 1L, Long::sum);
            }
        }

        long totalBeds = rooms.stream().mapToLong(Room::getCapacity).sum();
        long occupiedBeds = occupancyByRoom.values().stream().mapToLong(Long::longValue).sum();
        int rate = totalBeds == 0 ? 0 : (int) Math.round(occupiedBeds * 100.0 / totalBeds);

        Map<Integer, long[]> perFloor = new TreeMap<>(); // [chambres, lits, occupés]
        for (Room room : rooms) {
            long[] row = perFloor.computeIfAbsent(room.getFloor(), f -> new long[3]);
            row[0]++;
            row[1] += room.getCapacity();
            row[2] += occupancyByRoom.getOrDefault(room.getId(), 0L);
        }
        List<FloorStatDto> floors = perFloor.entrySet().stream()
                .map(e -> new FloorStatDto(e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2]))
                .toList();

        Map<Role, Long> usersByRole = new EnumMap<>(Role.class);
        for (Role role : Role.values()) {
            usersByRole.put(role, users.stream().filter(u -> u.getRole() == role && u.isEnabled()).count());
        }
        long enabledUsers = users.stream().filter(User::isEnabled).count();

        List<ResidentDto> recent = active.stream()
                .sorted(Comparator.comparing(Resident::getAdmissionDate).reversed()
                        .thenComparing(Resident::getId, Comparator.reverseOrder()))
                .limit(5)
                .map(ResidentMapper::toDto)
                .toList();

        return new DashboardStatsDto(
                active.size(),
                residents.size() - active.size(),
                unassigned,
                rooms.size(),
                totalBeds,
                occupiedBeds,
                Math.max(totalBeds - occupiedBeds, 0),
                rate,
                enabledUsers,
                users.size() - enabledUsers,
                usersByRole,
                floors,
                recent);
    }
}
