package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Job;
import com.esigelec.ehpad_backend.entity.PlanningTask;
import com.esigelec.ehpad_backend.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanningTaskRepository extends JpaRepository<PlanningTask, Long> {

    List<PlanningTask> findByJobAndShift(Job job, Shift shift);
}
