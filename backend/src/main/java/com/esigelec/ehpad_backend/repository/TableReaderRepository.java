package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.TableReader;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TableReaderRepository extends JpaRepository<TableReader, Long> {

    Optional<TableReader> findByCodeIgnoreCase(String code);

}
