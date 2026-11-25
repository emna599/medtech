package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.RoomDto;
import com.esigelec.ehpad_backend.dto.RoomRequest;
import com.esigelec.ehpad_backend.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Gestion des chambres et des étages. Réservé au rôle ADMIN (voir SecurityConfig). */
@RestController
@RequestMapping("/api/admin/rooms")
public class AdminRoomController {

    private final RoomService service;

    public AdminRoomController(RoomService service) {
        this.service = service;
    }

    @GetMapping
    public List<RoomDto> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public RoomDto get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomDto create(@Valid @RequestBody RoomRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public RoomDto update(@PathVariable Long id, @Valid @RequestBody RoomRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
