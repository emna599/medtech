package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.DiningTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiningTableRepository extends JpaRepository<DiningTable, Long> {

    List<DiningTable> findAllByOrderByIdAsc();
}
