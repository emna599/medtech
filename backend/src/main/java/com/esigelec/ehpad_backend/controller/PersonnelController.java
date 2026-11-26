package com.esigelec.ehpad_backend.controller;

import com.esigelec.ehpad_backend.dto.AppetiteDto;
import com.esigelec.ehpad_backend.dto.AssistantReply;
import com.esigelec.ehpad_backend.dto.AssistantRequest;
import com.esigelec.ehpad_backend.dto.ChevaletDto;
import com.esigelec.ehpad_backend.dto.ChevaletRequest;
import com.esigelec.ehpad_backend.dto.CompleteRequest;
import com.esigelec.ehpad_backend.dto.DoubtDto;
import com.esigelec.ehpad_backend.dto.DoubtRequest;
import com.esigelec.ehpad_backend.dto.IdentifyRequest;
import com.esigelec.ehpad_backend.dto.LocationRequest;
import com.esigelec.ehpad_backend.dto.MeDto;
import com.esigelec.ehpad_backend.dto.NoteDto;
import com.esigelec.ehpad_backend.dto.NoteRequest;
import com.esigelec.ehpad_backend.dto.PlanningDto;
import com.esigelec.ehpad_backend.dto.QuantityRequest;
import com.esigelec.ehpad_backend.dto.PochetteScanDto;
import com.esigelec.ehpad_backend.dto.ResidentCardDto;
import com.esigelec.ehpad_backend.dto.ServiceItemDto;
import com.esigelec.ehpad_backend.dto.ServiceKind;
import com.esigelec.ehpad_backend.dto.TeamDto;
import com.esigelec.ehpad_backend.service.AppetiteService;
import com.esigelec.ehpad_backend.service.AssistantService;
import com.esigelec.ehpad_backend.service.CareService;
import com.esigelec.ehpad_backend.service.ChevaletService;
import com.esigelec.ehpad_backend.service.IdentityDoubtService;
import com.esigelec.ehpad_backend.entity.ResidentPhoto;
import com.esigelec.ehpad_backend.service.NoteService;
import com.esigelec.ehpad_backend.service.PochetteScanService;
import com.esigelec.ehpad_backend.service.ResidentPhotoService;
import com.esigelec.ehpad_backend.service.StaffService;
import com.esigelec.ehpad_backend.service.TeamService;
import com.esigelec.ehpad_backend.service.ResidentService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * API de l'espace PERSONNEL (accès PERSONNEL et ADMIN, voir SecurityConfig).
 * Le soignant est toujours celui du jeton : il n'est jamais envoyé par le frontend.
 */
@RestController
@RequestMapping("/api/personnel")
public class PersonnelController {

    private final ResidentService residentService;
    private final CareService careService;
    private final IdentityDoubtService doubtService;
    private final AssistantService assistantService;
    private final AppetiteService appetiteService;
    private final PochetteScanService pochetteScanService;
    private final StaffService staffService;
    private final NoteService noteService;
    private final ResidentPhotoService photoService;
    private final TeamService teamService;
    private final ChevaletService chevaletService;

    public PersonnelController(ResidentService residentService,
                               CareService careService,
                               IdentityDoubtService doubtService,
                               AssistantService assistantService,
                               AppetiteService appetiteService,
                               PochetteScanService pochetteScanService,
                               StaffService staffService,
                               NoteService noteService,
                               ResidentPhotoService photoService,
                               TeamService teamService,
                               ChevaletService chevaletService) {
        this.residentService = residentService;
        this.careService = careService;
        this.doubtService = doubtService;
        this.assistantService = assistantService;
        this.appetiteService = appetiteService;
        this.pochetteScanService = pochetteScanService;
        this.staffService = staffService;
        this.noteService = noteService;
        this.photoService = photoService;
        this.teamService = teamService;
        this.chevaletService = chevaletService;
    }

    // ------------------------------------------------------------ moi, planning, notes

    /** Le soignant connecté : fonction (infirmier / aide-soignant), équipe et droits. */
    @GetMapping("/me")
    public MeDto me(Authentication authentication) {
        return staffService.me(authentication.getName());
    }

    /** Planning type (fixe) de la fonction et de l'équipe du soignant. */
    @GetMapping("/planning")
    public PlanningDto planning(Authentication authentication) {
        return staffService.planning(authentication.getName());
    }

    /** Équipe en service et part de résidents de chacun. */
    @GetMapping("/team")
    public TeamDto team(Authentication authentication) {
        return teamService.team(authentication.getName());
    }

    @PostMapping("/team/check-in")
    public TeamDto checkIn(Authentication authentication) {
        return teamService.checkIn(authentication.getName());
    }

    @PostMapping("/team/check-out")
    public TeamDto checkOut(Authentication authentication) {
        return teamService.checkOut(authentication.getName());
    }

    @GetMapping("/notes")
    public List<NoteDto> notes(@RequestParam(required = false) Long residentId) {
        return noteService.list(residentId);
    }

    @PostMapping("/notes")
    public NoteDto addNote(@Valid @RequestBody NoteRequest request, Authentication authentication) {
        return noteService.create(request, authentication.getName());
    }

    // ------------------------------------------------------------ résidents

    @GetMapping("/residents")
    public List<ResidentCardDto> residents(@RequestParam(required = false) String search) {
        return residentService.list(search);
    }

    /** Identifiants des résidents qui ont un bracelet (NFC ou QR code). */
    @GetMapping("/bracelets")
    public List<Long> bracelets() {
        return residentService.idsWithBracelet();
    }

    /** Chevalet associé au résident, ou 204 s'il n'en a pas. */
    @GetMapping("/residents/{id}/chevalet")
    public ResponseEntity<ChevaletDto> chevalet(@PathVariable Long id) {
        return chevaletService.forResident(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/chevalets/associate")
    public ChevaletDto associateChevalet(@Valid @RequestBody ChevaletRequest request, Authentication authentication) {
        return chevaletService.associate(request, authentication.getName());
    }

    @DeleteMapping("/residents/{id}/chevalet")
    public ResponseEntity<Void> releaseChevalet(@PathVariable Long id, Authentication authentication) {
        chevaletService.release(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/residents/{id}")
    public ResidentCardDto resident(@PathVariable Long id) {
        return residentService.get(id);
    }

    /** Appétit des derniers jours (7 par défaut, de 3 à 14). */
    @GetMapping("/residents/{id}/appetite")
    public AppetiteDto appetite(@PathVariable Long id, @RequestParam(defaultValue = "7") int days) {
        return appetiteService.forResident(id, days);
    }

    /** Photo d'un résident (affichée par le front avec le jeton de connexion). */
    @GetMapping("/residents/{id}/photo")
    public ResponseEntity<byte[]> photo(@PathVariable Long id) {
        ResidentPhoto photo = photoService.get(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePrivate())
                .body(photo.getData());
    }

    /** Envoi d'une photo : réservé à l'administrateur (contrôlé dans le service). */
    @PostMapping(value = "/residents/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadPhoto(@PathVariable Long id,
                                           @RequestPart("photo") MultipartFile photo,
                                           Authentication authentication) {
        return Map.of("photoUrl", photoService.save(id, photo, authentication.getName()));
    }

    @PutMapping("/residents/{id}/meal-location")
    public ResidentCardDto changeMealLocation(@PathVariable Long id,
                                              @Valid @RequestBody LocationRequest request,
                                              Authentication authentication) {
        return residentService.changeMealLocation(id, request.mealLocation(), authentication.getName());
    }

    /** Identification par le code anonyme d'un bracelet ou d'un badge (facultatif). */
    @PostMapping("/identify")
    public ResidentCardDto identify(@Valid @RequestBody IdentifyRequest request, Authentication authentication) {
        return residentService.identifyByCode(request.code(), authentication.getName());
    }

    /** Photo de l'étiquette d'une pochette : l'OCR propose un résident, le soignant vérifie le visage. */
    @PostMapping(value = "/identify/pochette", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PochetteScanDto identifyByPochette(@RequestPart("photo") MultipartFile photo, Authentication authentication) {
        return pochetteScanService.scan(photo, authentication.getName());
    }

    // ------------------------------------------------------------ repas et médicaments du jour

    @GetMapping("/service")
    public List<ServiceItemDto> service(@RequestParam ServiceKind kind) {
        return careService.listToday(kind);
    }

    @PostMapping("/meals/{id}/complete")
    public ServiceItemDto completeMeal(@PathVariable Long id,
                                       @Valid @RequestBody CompleteRequest request,
                                       Authentication authentication) {
        return careService.completeMeal(id, request, authentication.getName());
    }

    @PutMapping("/meals/{id}/quantity")
    public ServiceItemDto mealQuantity(@PathVariable Long id,
                                       @Valid @RequestBody QuantityRequest request,
                                       Authentication authentication) {
        return careService.setQuantity(id, request.quantityEaten(), authentication.getName());
    }

    @PostMapping("/doses/{id}/complete")
    public ServiceItemDto completeDose(@PathVariable Long id,
                                       @Valid @RequestBody CompleteRequest request,
                                       Authentication authentication) {
        staffService.requireMedicationRights(authentication.getName());
        return careService.completeDose(id, request, authentication.getName());
    }

    // ------------------------------------------------------------ doutes d'identité

    @GetMapping("/identity-doubts")
    public List<DoubtDto> openDoubts() {
        return doubtService.listOpen();
    }

    @PostMapping("/identity-doubts")
    public DoubtDto reportDoubt(@Valid @RequestBody DoubtRequest request, Authentication authentication) {
        return doubtService.report(request, authentication.getName());
    }

    @PostMapping("/identity-doubts/{id}/resolve")
    public DoubtDto resolveDoubt(@PathVariable Long id, Authentication authentication) {
        return doubtService.resolve(id, authentication.getName());
    }

    // ------------------------------------------------------------ assistant

    /** Répond à une question en français. N'enregistre rien : une action proposée doit être confirmée. */
    @PostMapping("/assistant")
    public AssistantReply assistant(@Valid @RequestBody AssistantRequest request) {
        return assistantService.answer(request.message());
    }
}
