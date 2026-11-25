package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.RoomDto;
import com.esigelec.ehpad_backend.dto.RoomRequest;
import com.esigelec.ehpad_backend.entity.Room;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import com.esigelec.ehpad_backend.repository.RoomRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final ResidentRepository residentRepository;

    public RoomService(RoomRepository roomRepository, ResidentRepository residentRepository) {
        this.roomRepository = roomRepository;
        this.residentRepository = residentRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomDto> list() {
        Map<Long, Long> occupancy = occupancyByRoom();
        return roomRepository.findAll(Sort.by("floor", "number")).stream()
                .map(room -> toDto(room, occupancy.getOrDefault(room.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomDto get(Long id) {
        Room room = find(id);
        return toDto(room, residentRepository.countByRoomIdAndActiveTrue(id));
    }

    @Transactional
    public RoomDto create(RoomRequest request) {
        String number = request.number().trim();
        if (roomRepository.findByNumber(number).isPresent()) {
            throw new ConflictException("Ce numéro de chambre existe déjà");
        }
        Room room = new Room();
        room.setNumber(number);
        room.setFloor(request.floor());
        room.setCapacity(request.capacity());
        return toDto(roomRepository.saveAndFlush(room), 0);
    }

    @Transactional
    public RoomDto update(Long id, RoomRequest request) {
        Room room = find(id);
        String number = request.number().trim();
        roomRepository.findByNumber(number).ifPresent(other -> {
            if (!other.getId().equals(id)) {
                throw new ConflictException("Ce numéro de chambre existe déjà");
            }
        });
        long occupied = residentRepository.countByRoomIdAndActiveTrue(id);
        if (request.capacity() < occupied) {
            throw new ConflictException("La chambre contient déjà " + occupied
                    + " résident(s) : la capacité ne peut pas être inférieure");
        }
        room.setNumber(number);
        room.setFloor(request.floor());
        room.setCapacity(request.capacity());
        return toDto(roomRepository.saveAndFlush(room), occupied);
    }

    @Transactional
    public void delete(Long id) {
        Room room = find(id);
        if (residentRepository.countByRoomIdAndActiveTrue(id) > 0) {
            throw new ConflictException("Cette chambre contient encore des résidents : déplacez-les d'abord");
        }
        roomRepository.delete(room);
    }

    private Room find(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable"));
    }

    private Map<Long, Long> occupancyByRoom() {
        Map<Long, Long> result = new HashMap<>();
        for (Object[] row : residentRepository.countActiveByRoom()) {
            result.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return result;
    }

    private static RoomDto toDto(Room room, long occupied) {
        return new RoomDto(room.getId(), room.getNumber(), room.getFloor(), room.getCapacity(), occupied);
    }
}
