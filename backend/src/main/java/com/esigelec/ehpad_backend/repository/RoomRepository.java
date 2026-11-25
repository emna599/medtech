package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
}
