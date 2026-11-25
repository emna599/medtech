package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.ResidentDto;
import com.esigelec.ehpad_backend.dto.ResidentRequest;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.Room;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.mapper.ResidentMapper;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import com.esigelec.ehpad_backend.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class ResidentService {

    private final ResidentRepository residentRepository;
    private final RoomRepository roomRepository;

    public ResidentService(ResidentRepository residentRepository, RoomRepository roomRepository) {
        this.residentRepository = residentRepository;
        this.roomRepository = roomRepository;
    }

    /**
     * Liste des résidents, filtrable par texte (nom ou prénom), état et chambre.
     * Le volume d'un EHPAD est faible : le filtre se fait en mémoire.
     */
    @Transactional(readOnly = true)
    public List<ResidentDto> list(String search, Boolean active, Long roomId) {
        String needle = normalize(search);
        return residentRepository.findAllWithRoom().stream()
                .filter(r -> active == null || r.isActive() == active)
                .filter(r -> roomId == null || (r.getRoom() != null && r.getRoom().getId().equals(roomId)))
                .filter(r -> needle.isEmpty()
                        || normalize(r.getLastName() + " " + r.getFirstName()).contains(needle)
                        || normalize(r.getFirstName() + " " + r.getLastName()).contains(needle))
                .sorted(Comparator.comparing((Resident r) -> normalize(r.getLastName()))
                        .thenComparing(r -> normalize(r.getFirstName())))
                .map(ResidentMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResidentDto get(Long id) {
        return ResidentMapper.toDto(find(id));
    }

    @Transactional
    public ResidentDto create(ResidentRequest request) {
        validateDates(request);
        Resident resident = new Resident();
        boolean active = request.active() == null || request.active();
        Room room = loadRoom(request.roomId());
        checkCapacity(room, active, null);
        apply(resident, request, room, active);
        return ResidentMapper.toDto(residentRepository.saveAndFlush(resident));
    }

    @Transactional
    public ResidentDto update(Long id, ResidentRequest request) {
        validateDates(request);
        Resident resident = find(id);
        boolean active = request.active() == null ? resident.isActive() : request.active();
        Room room = loadRoom(request.roomId());
        checkCapacity(room, active, resident);
        apply(resident, request, room, active);
        return ResidentMapper.toDto(residentRepository.saveAndFlush(resident));
    }

    private void apply(Resident resident, ResidentRequest request, Room room, boolean active) {
        resident.setFirstName(request.firstName().trim());
        resident.setLastName(request.lastName().trim());
        resident.setBirthDate(request.birthDate());
        resident.setAdmissionDate(request.admissionDate());
        resident.setRoom(room);
        resident.setActive(active);
    }

    private void validateDates(ResidentRequest request) {
        if (request.admissionDate().isBefore(request.birthDate())) {
            throw new BadRequestException("La date d'admission ne peut pas précéder la date de naissance");
        }
    }

    private Room loadRoom(Long roomId) {
        if (roomId == null) {
            return null;
        }
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new BadRequestException("Chambre introuvable"));
    }

    /** Une chambre ne peut pas dépasser sa capacité (seuls les résidents actifs comptent). */
    private void checkCapacity(Room room, boolean active, Resident current) {
        if (room == null || !active) {
            return;
        }
        boolean alreadyInRoom = current != null && current.isActive() && current.getRoom() != null
                && current.getRoom().getId().equals(room.getId());
        if (alreadyInRoom) {
            return;
        }
        if (residentRepository.countByRoomIdAndActiveTrue(room.getId()) >= room.getCapacity()) {
            throw new ConflictException("La chambre " + room.getNumber() + " est complète");
        }
    }

    private Resident find(Long id) {
        return residentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));
    }

    private static String normalize(String text) {
        if (text == null) {
            return "";
        }
        return Normalizer.normalize(text.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
    }
}
