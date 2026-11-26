package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.DiningDto;
import com.esigelec.ehpad_backend.dto.ReadingDto;
import com.esigelec.ehpad_backend.dto.ReadingRequest;
import com.esigelec.ehpad_backend.dto.MenuEntryDto;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.dto.WeeklyMenuDto;
import com.esigelec.ehpad_backend.entity.Chevalet;
import com.esigelec.ehpad_backend.entity.DiningTable;
import com.esigelec.ehpad_backend.entity.Meal;
import com.esigelec.ehpad_backend.entity.Resident;
import com.esigelec.ehpad_backend.entity.TablePresence;
import com.esigelec.ehpad_backend.entity.TableReader;
import com.esigelec.ehpad_backend.entity.User;
import com.esigelec.ehpad_backend.entity.ServiceStatus;
import com.esigelec.ehpad_backend.entity.WeeklyMenu;
import com.esigelec.ehpad_backend.exception.BadRequestException;
import com.esigelec.ehpad_backend.exception.ConflictException;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.ChevaletRepository;
import com.esigelec.ehpad_backend.repository.DiningTableRepository;
import com.esigelec.ehpad_backend.repository.MealRepository;
import com.esigelec.ehpad_backend.repository.ResidentRepository;
import com.esigelec.ehpad_backend.repository.TablePresenceRepository;
import com.esigelec.ehpad_backend.repository.TableReaderRepository;
import com.esigelec.ehpad_backend.repository.WeeklyMenuRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Interface Service : les tables de la salle à manger, leurs résidents et le menu de la semaine. */
@Service
public class DiningService {

    static final List<String> SLOTS = List.of("DEJEUNER", "DINER");

    private final DiningTableRepository tableRepository;
    private final MealRepository mealRepository;
    private final ChevaletRepository chevaletRepository;
    private final WeeklyMenuRepository menuRepository;
    private final ResidentCardAssembler assembler;
    private final TableReaderRepository readerRepository;
    private final TablePresenceRepository presenceRepository;
    private final ResidentRepository residentRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public DiningService(DiningTableRepository tableRepository,
                         MealRepository mealRepository,
                         ChevaletRepository chevaletRepository,
                         WeeklyMenuRepository menuRepository,
                         ResidentCardAssembler assembler,
                         TableReaderRepository readerRepository,
                         TablePresenceRepository presenceRepository,
                         ResidentRepository residentRepository,
                         CurrentUserService currentUserService,
                         AuditService auditService) {
        this.tableRepository = tableRepository;
        this.mealRepository = mealRepository;
        this.chevaletRepository = chevaletRepository;
        this.menuRepository = menuRepository;
        this.assembler = assembler;
        this.readerRepository = readerRepository;
        this.presenceRepository = presenceRepository;
        this.residentRepository = residentRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    /** Repas affiché par défaut : le déjeuner jusqu'à 15 h, le dîner ensuite. */
    static String defaultSlot(LocalTime now) {
        return now.isBefore(LocalTime.of(15, 0)) ? "DEJEUNER" : "DINER";
    }

    /** Lundi de la semaine qui contient la date. */
    static LocalDate mondayOf(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    @Transactional(readOnly = true)
    public DiningDto tables(String slot) {
        String meal = slot == null || slot.isBlank() ? defaultSlot(LocalTime.now()) : slot.toUpperCase();
        if (!SLOTS.contains(meal)) {
            throw new BadRequestException("Repas inconnu : " + slot);
        }
        LocalDate today = LocalDate.now();

        // Qui est assis où : les bracelets lus aujourd'hui et pas encore « repartis », dans l'ordre d'arrivée
        List<TablePresence> presences = presenceRepository.findByLeftAtIsNullAndArrivedAtAfterOrderByArrivedAtAsc(today.atStartOfDay());
        Map<Long, Resident> residents = new HashMap<>();
        residentRepository.findAllById(presences.stream().map(TablePresence::getResidentId).distinct().toList())
                .stream().filter(Resident::isActive).forEach(resident -> residents.put(resident.getId(), resident));
        Map<Long, ResidentCardDto> cards = assembler.assemble(residents.values());

        Map<Long, Meal> meals = new HashMap<>();
        for (Meal candidate : mealRepository.findActiveBetween(today.atStartOfDay(), today.plusDays(1).atStartOfDay())) {
            if (meal.equalsIgnoreCase(candidate.getType())) {
                meals.putIfAbsent(candidate.getResident().getId(), candidate);
            }
        }
        Map<Long, String> chevalets = new HashMap<>();
        for (Chevalet chevalet : chevaletRepository.findAll()) {
            if (chevalet.getResident() != null) {
                chevalets.put(chevalet.getResident().getId(), chevalet.getCode());
            }
        }
        Map<Long, String> readers = new HashMap<>();
        for (TableReader reader : readerRepository.findAll()) {
            readers.put(reader.getTableId(), reader.getCode());
        }

        Map<Long, List<DiningDto.Seat>> byTable = new HashMap<>();
        for (TablePresence presence : presences) {
            ResidentCardDto card = cards.get(presence.getResidentId());
            if (card == null) {
                continue;
            }
            List<DiningDto.Seat> atTable = byTable.computeIfAbsent(presence.getTableId(), id -> new ArrayList<>());
            Meal planned = meals.get(presence.getResidentId());
            atTable.add(new DiningDto.Seat(
                    atTable.size() + 1,
                    card,
                    chevalets.get(presence.getResidentId()),
                    planned == null ? null : new DiningDto.Meal(planned.getId(), planned.getDescription(), planned.getStatus())));
        }

        List<DiningDto.Table> tables = new ArrayList<>();
        int seated = 0;
        int served = 0;
        for (DiningTable table : tableRepository.findAllByOrderByIdAsc()) {
            List<DiningDto.Seat> tableSeats = byTable.getOrDefault(table.getId(), List.of());
            int done = (int) tableSeats.stream().filter(DiningService::isServed).count();
            tables.add(new DiningDto.Table(table.getId(), table.getLabel(), table.getCapacity(),
                    tableSeats.size(), done, readers.get(table.getId()), tableSeats));
            seated += tableSeats.size();
            served += done;
        }
        return new DiningDto(meal, today, menuEntry(today, meal), seated, served, tables);
    }

    /**
     * Lecture d'un bracelet par le lecteur d'une table : le résident est installé à cette table (il s'assoit où il veut),
     * ou noté comme parti. Une table accepte 8 résidents au maximum.
     */
    @Transactional
    public ReadingDto reading(ReadingRequest request, String username) {
        User user = currentUserService.require(username);
        TableReader reader = readerRepository.findByCodeIgnoreCase(request.readerCode().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Lecteur inconnu : " + request.readerCode()));
        DiningTable table = tableRepository.findById(reader.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table introuvable"));

        Long residentId = request.residentId();
        if (residentId == null) {
            String token = request.token() == null ? "" : request.token().trim();
            if (token.isEmpty()) {
                throw new BadRequestException("Le bracelet ou le résident est obligatoire");
            }
            residentId = residentRepository.findResidentIdByActiveNfcToken(token)
                    .or(() -> residentRepository.findResidentIdByActiveQrToken(token))
                    .orElseThrow(() -> new ResourceNotFoundException("Bracelet inconnu"));
        }
        Resident resident = residentRepository.findActiveById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Résident introuvable"));
        String name = resident.getFirstName() + " " + resident.getLastName();

        List<TablePresence> open = presenceRepository.findByResidentIdAndLeftAtIsNull(residentId);
        LocalDateTime now = LocalDateTime.now();
        if (request.leaving()) {
            open.forEach(presence -> presence.setLeftAt(now));
            auditService.record(user, "TABLE_DEPART", "Resident", residentId);
            return new ReadingDto("LEFT", residentId, name, table.getLabel(), name + " a quitté la table");
        }
        if (open.stream().anyMatch(presence -> presence.getTableId().equals(table.getId()))) {
            return new ReadingDto("ALREADY", residentId, name, table.getLabel(), name + " est déjà à " + table.getLabel());
        }
        long seated = presenceRepository.findByLeftAtIsNullAndArrivedAtAfterOrderByArrivedAtAsc(LocalDate.now().atStartOfDay())
                .stream().filter(presence -> presence.getTableId().equals(table.getId())).count();
        if (seated >= table.getCapacity()) {
            throw new ConflictException(table.getLabel() + " est complète (" + table.getCapacity() + " résidents)");
        }
        boolean moved = !open.isEmpty();
        open.forEach(presence -> presence.setLeftAt(now));  // il vient d'une autre table
        presenceRepository.save(new TablePresence(residentId, table.getId()));
        auditService.record(user, "TABLE_ARRIVEE", "Resident", residentId);
        return new ReadingDto(moved ? "MOVED" : "OK", residentId, name, table.getLabel(), name + " est installé à " + table.getLabel());
    }

    private static boolean isServed(DiningDto.Seat seat) {
        return seat.meal() != null
                && (seat.meal().status() == ServiceStatus.FAIT || seat.meal().status() == ServiceStatus.REFUSE);
    }

    /** Menu de la semaine qui contient la date ; à défaut, celui de la dernière semaine saisie (le menu se répète). */
    @Transactional(readOnly = true)
    public WeeklyMenuDto menu(LocalDate date) {
        LocalDate monday = mondayOf(date == null ? LocalDate.now() : date);
        Optional<LocalDate> source = menuRepository.latestWeekStart(monday);
        List<MenuEntryDto> entries = source
                .map(start -> menuRepository.findByWeekStartOrderByDayOfWeekAscMealTypeAsc(start).stream()
                        .map(DiningService::toEntry)
                        .toList())
                .orElse(List.of());
        return new WeeklyMenuDto(monday, entries);
    }

    private MenuEntryDto menuEntry(LocalDate date, String mealType) {
        return menu(date).entries().stream()
                .filter(entry -> entry.dayOfWeek() == date.getDayOfWeek().getValue() && entry.mealType().equalsIgnoreCase(mealType))
                .findFirst()
                .orElse(null);
    }

    private static MenuEntryDto toEntry(WeeklyMenu menu) {
        return new MenuEntryDto(menu.getDayOfWeek(), menu.getMealType(), menu.getStarter(),
                menu.getMainCourse(), menu.getSide(), menu.getDessert());
    }

}
