package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByNumber(String number);
}
