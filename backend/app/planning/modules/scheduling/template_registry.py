"""
Configurable event template registry for the Scheduling Engine.
Provides deterministic, domain-specific activity templates for all 9 supported
event types without arbitrary or invented facts.
All templates and durations are explicitly labeled as suggestions.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.event import EventType
from backend.app.planning.modules.food.schemas import MealType
from backend.app.planning.modules.scheduling.schemas import ActivityType


class TemplateActivity(BaseModel):
    """
    Template activity building block for an event schedule.
    Durations represent reasonable planning defaults and can be scaled or adjusted.
    """
    title: str = Field(..., description="Suggested activity title")
    activity_type: ActivityType = Field(..., description="Classification of the activity")
    default_duration_minutes: int = Field(..., gt=0, description="Recommended default duration in minutes")
    min_duration_minutes: int = Field(..., gt=0, description="Minimum acceptable duration in tight windows")
    description: str = Field(..., description="Operational purpose and context of the activity")
    priority: int = Field(default=2, ge=1, le=5, description="1=Vital/Core, 2=Important, 3=Standard, 4=Flexible, 5=Optional")
    is_sustainability_action: bool = Field(default=False, description="Flag for green/sustainability briefings or audits")


class EventTemplate(BaseModel):
    """
    Full schedule template for an event category.
    """
    event_type: EventType
    name: str
    description: str
    recommended_setup_minutes: int = Field(default=45, ge=15, le=120)
    recommended_cleanup_minutes: int = Field(default=45, ge=15, le=120)
    day_1_activities: List[TemplateActivity]
    subsequent_day_activities: Optional[List[TemplateActivity]] = None
    is_suggestion: bool = Field(default=True, description="Identifies template contents as suggestions")


# -------------------------------------------------------------------------
# Default Meal Timing Reference Baselines
# -------------------------------------------------------------------------
MEAL_DEFAULTS: Dict[MealType, Dict[str, any]] = {
    MealType.BREAKFAST: {
        "title": "Morning Breakfast & Coffee",
        "default_duration_minutes": 45,
        "min_duration_minutes": 30,
        "preferred_hour": 8,
        "preferred_minute": 30,
        "description": "Buffet breakfast serving. Encourage reusable plates and cups.",
    },
    MealType.LUNCH: {
        "title": "Networking Lunch & Dining",
        "default_duration_minutes": 60,
        "min_duration_minutes": 40,
        "preferred_hour": 13,
        "preferred_minute": 0,
        "description": "Main lunch meal service with segregated waste collection stations.",
    },
    MealType.SNACKS: {
        "title": "Afternoon Refreshment & Snack Break",
        "default_duration_minutes": 30,
        "min_duration_minutes": 20,
        "preferred_hour": 16,
        "preferred_minute": 0,
        "description": "Afternoon tea, coffee, and light snacks with zero single-use plastics.",
    },
    MealType.HIGH_TEA: {
        "title": "High Tea & Networking",
        "default_duration_minutes": 35,
        "min_duration_minutes": 25,
        "preferred_hour": 16,
        "preferred_minute": 30,
        "description": "Curated high tea service with washable cups and compostable napkins.",
    },
    MealType.REFRESHMENTS: {
        "title": "Refreshment & Water Break",
        "default_duration_minutes": 25,
        "min_duration_minutes": 15,
        "preferred_hour": 11,
        "preferred_minute": 0,
        "description": "Mid-session hydration and light refreshments using refillable stations.",
    },
    MealType.DINNER: {
        "title": "Dinner & Social Gathering",
        "default_duration_minutes": 60,
        "min_duration_minutes": 45,
        "preferred_hour": 20,
        "preferred_minute": 0,
        "description": "Evening dinner service with leftover food packing protocols.",
    },
}


# -------------------------------------------------------------------------
# Supported Event Templates Registry (9 Event Types)
# -------------------------------------------------------------------------
EVENT_TEMPLATES: Dict[EventType, EventTemplate] = {
    EventType.WORKSHOP: EventTemplate(
        event_type=EventType.WORKSHOP,
        name="Interactive Skill Workshop",
        description="Structured educational training with conceptual intro, hands-on lab, and Q&A.",
        recommended_setup_minutes=30,
        recommended_cleanup_minutes=30,
        day_1_activities=[
            TemplateActivity(
                title="Participant Registration & Welcome Materials",
                activity_type=ActivityType.REGISTRATION,
                default_duration_minutes=30,
                min_duration_minutes=15,
                description="Attendee badge check-in, digital handbook QR scan, and workspace seating.",
                priority=1,
            ),
            TemplateActivity(
                title="Workshop Opening & Green Event Briefing",
                activity_type=ActivityType.OPENING,
                default_duration_minutes=20,
                min_duration_minutes=10,
                description="Instructor welcome, objective setting, and 2-minute green guidelines overview.",
                priority=2,
                is_sustainability_action=True,
            ),
            TemplateActivity(
                title="Part 1: Conceptual Foundations & Live Demos",
                activity_type=ActivityType.WORKSHOP,
                default_duration_minutes=90,
                min_duration_minutes=45,
                description="Core lecture, fundamental principles, and step-by-step instructor walkthrough.",
                priority=1,
            ),
            TemplateActivity(
                title="Part 2: Guided Hands-on Practical Exercises",
                activity_type=ActivityType.WORKSHOP,
                default_duration_minutes=105,
                min_duration_minutes=60,
                description="Attendees work individually or in pairs through practical problem sets.",
                priority=1,
            ),
            TemplateActivity(
                title="Group Project Reviews & Code / Output Critique",
                activity_type=ActivityType.SESSION,
                default_duration_minutes=45,
                min_duration_minutes=25,
                description="Volunteers demonstrate working outputs with instructor feedback.",
                priority=3,
            ),
            TemplateActivity(
                title="Participant Q&A and Feedback Survey",
                activity_type=ActivityType.SESSION,
                default_duration_minutes=25,
                min_duration_minutes=15,
                description="Open floor questions and digital evaluation submission.",
                priority=2,
            ),
            TemplateActivity(
                title="Closing Remarks & Digital Certificate Distribution",
                activity_type=ActivityType.CLOSING,
                default_duration_minutes=20,
                min_duration_minutes=10,
                description="Wrap-up speech, resource links, and closing acknowledgements.",
                priority=2,
            ),
        ],
    ),
    EventType.CONFERENCE: EventTemplate(
        event_type=EventType.CONFERENCE,
        name="Academic / Industry Conference",
        description="Multi-track presentations, keynote speakers, paper sessions, and formal plenary discussions.",
        recommended_setup_minutes=45,
        recommended_cleanup_minutes=45,
        day_1_activities=[
            TemplateActivity(
                title="Conference Check-in & Badge Distribution",
                activity_type=ActivityType.REGISTRATION,
                default_duration_minutes=45,
                min_duration_minutes=25,
                description="Delegate arrival, identity verification, and conference program distribution.",
                priority=1,
            ),
            TemplateActivity(
                title="Inaugural Session & Welcome Address",
                activity_type=ActivityType.OPENING,
                default_duration_minutes=30,
                min_duration_minutes=15,
                description="Dignitary lamp lighting, welcome address, and conference theme introduction.",
                priority=1,
            ),
            TemplateActivity(
                title="Distinguished Keynote Address",
                activity_type=ActivityType.KEYNOTE,
                default_duration_minutes=60,
                min_duration_minutes=40,
                description="Invited keynote presentation followed by delegate interaction.",
                priority=1,
            ),
            TemplateActivity(
                title="Technical Paper Presentations / Track Sessions",
                activity_type=ActivityType.SESSION,
                default_duration_minutes=90,
                min_duration_minutes=60,
                description="Peer-reviewed paper readings, domain research findings, and session chair remarks.",
                priority=1,
            ),
            TemplateActivity(
                title="Industry Panel Discussion & Delegate Q&A",
                activity_type=ActivityType.SESSION,
                default_duration_minutes=60,
                min_duration_minutes=40,
                description="Moderated panel with domain experts addressing contemporary developments.",
                priority=2,
            ),
            TemplateActivity(
                title="Valedictory Ceremony & Best Paper Awards",
                activity_type=ActivityType.AWARDS,
                default_duration_minutes=30,
                min_duration_minutes=20,
                description="Recognition of outstanding research contributions and sponsor felicitations.",
                priority=2,
            ),
            TemplateActivity(
                title="Vote of Thanks & Official Adjournment",
                activity_type=ActivityType.CLOSING,
                default_duration_minutes=15,
                min_duration_minutes=10,
                description="Formal expression of gratitude to organizers, venue staff, and delegates.",
                priority=3,
            ),
        ],
    ),
    EventType.HACKATHON: EventTemplate(
        event_type=EventType.HACKATHON,
        name="Collaborative Hackathon / Buildathon",
        description="Intensive collaborative problem-solving, rapid prototyping, mentoring, and judging.",
        recommended_setup_minutes=45,
        recommended_cleanup_minutes=45,
        day_1_activities=[
            TemplateActivity(
                title="Hacker Team Check-in & Station Assignment",
                activity_type=ActivityType.REGISTRATION,
                default_duration_minutes=45,
                min_duration_minutes=25,
                description="Team badge issuance, power strip testing, and workspace onboarding.",
                priority=1,
            ),
            TemplateActivity(
                title="Opening Ceremony & Track Problem Statements",
                activity_type=ActivityType.OPENING,
                default_duration_minutes=35,
                min_duration_minutes=20,
                description="Rules, API guidelines, judging criteria, and green hackathon reminders.",
                priority=1,
                is_sustainability_action=True,
            ),
            TemplateActivity(
                title="Sprint Phase 1: Architecture & Prototyping",
                activity_type=ActivityType.COMPETITION,
                default_duration_minutes=150,
                min_duration_minutes=90,
                description="Intensive coding and prototype construction by all participating teams.",
                priority=1,
            ),
            TemplateActivity(
                title="Mentor Checkpoint & Technical Guidance",
                activity_type=ActivityType.ACTIVITY,
                default_duration_minutes=45,
                min_duration_minutes=30,
                description="Industry mentors rotate among tables to unblock technical hurdles.",
                priority=2,
            ),
            TemplateActivity(
                title="Sprint Phase 2: Feature Finalization & Polish",
                activity_type=ActivityType.COMPETITION,
                default_duration_minutes=120,
                min_duration_minutes=75,
                description="Final sprint to lock codebase, test edge cases, and prepare pitch decks.",
                priority=1,
            ),
            TemplateActivity(
                title="Code Freeze & Live Project Pitches",
                activity_type=ActivityType.SESSION,
                default_duration_minutes=75,
                min_duration_minutes=45,
                description="Top shortlisted teams deliver 3-minute live demonstrations to judges.",
                priority=1,
            ),
            TemplateActivity(
                title="Jury Deliberation & Prize Distribution",
                activity_type=ActivityType.AWARDS,
                default_duration_minutes=35,
                min_duration_minutes=20,
                description="Announcement of winners, track awards, and closing group photo.",
                priority=1,
            ),
        ],
    ),
    EventType.TECH_FEST: EventTemplate(
        event_type=EventType.TECH_FEST,
        name="Annual College Technology Festival",
        description="Campus-wide technical competitions, project exhibits, guest lectures, and tech quizzes.",
        recommended_setup_minutes=60,
        recommended_cleanup_minutes=60,
        day_1_activities=[
            TemplateActivity(
                title="Central Gate Registration & Kit Distribution",
                activity_type=ActivityType.REGISTRATION,
                default_duration_minutes=45,
                min_duration_minutes=30,
                description="Welcoming students from participating colleges and issuing festival credentials.",
                priority=1,
            ),
            TemplateActivity(
                title="Grand Inauguration & Fest Unveiling",
                activity_type=ActivityType.OPENING,
                default_duration_minutes=30,
                min_duration_minutes=20,
                description="Principal address, dignitary remarks, and green campus festival pledge.",
                priority=1,
                is_sustainability_action=True,
            ),
            TemplateActivity(
                title="Project Exhibition & Robo-Wars / Technical Contests",
                activity_type=ActivityType.COMPETITION,
                default_duration_minutes=120,
                min_duration_minutes=75,
                description="Simultaneous competitive events across hardware, robotics, and innovation.",
                priority=1,
            ),
            TemplateActivity(
                title="Distinguished Tech Leader Keynote",
                activity_type=ActivityType.KEYNOTE,
                default_duration_minutes=50,
                min_duration_minutes=35,
                description="Guest speaker session on emerging technological horizons.",
                priority=2,
            ),
            TemplateActivity(
                title="Technical Paper / Coding Challenge Finals",
                activity_type=ActivityType.COMPETITION,
                default_duration_minutes=90,
                min_duration_minutes=60,
                description="Championship round between top qualifiers.",
                priority=2,
            ),
            TemplateActivity(
                title="Grand Valedictory & Trophy Presentation",
                activity_type=ActivityType.AWARDS,
                default_duration_minutes=45,
                min_duration_minutes=30,
                description="Distribution of rolling trophies, prize money, and organizing committee felicitations.",
                priority=1,
            ),
        ],
    ),
    EventType.CULTURAL_FEST: EventTemplate(
        event_type=EventType.CULTURAL_FEST,
        name="College Cultural Fest / Annual Day",
        description="Music, dance, theatre, arts, and student celebration.",
        recommended_setup_minutes=60,
        recommended_cleanup_minutes=60,
        day_1_activities=[
            TemplateActivity(
                title="Venue Open, Badge Collection & Gathering",
                activity_type=ActivityType.REGISTRATION,
                default_duration_minutes=40,
                min_duration_minutes=20,
                description="Auditorium seating, acoustic checks, and welcoming student audience.",
                priority=1,
            ),
            TemplateActivity(
                title="Inaugural Dance & Classical Invocation",
                activity_type=ActivityType.OPENING,
                default_duration_minutes=25,
                min_duration_minutes=15,
                description="Traditional invocation performance and welcome speech by student council.",
                priority=1,
            ),
            TemplateActivity(
                title="Solo & Group Music Competitions",
                activity_type=ActivityType.ACTIVITY,
                default_duration_minutes=90,
                min_duration_minutes=60,
                description="Vocal and instrumental performances evaluated by external cultural judges.",
                priority=2,
            ),
            TemplateActivity(
                title="Theatrical Drama & One-Act Plays",
                activity_type=ActivityType.ACTIVITY,
                default_duration_minutes=90,
                min_duration_minutes=60,
                description="Original student stage plays and social awareness street theatre acts.",
                priority=2,
            ),
            TemplateActivity(
                title="Inter-Department Choreography / Group Dance",
                activity_type=ActivityType.ACTIVITY,
                default_duration_minutes=90,
                min_duration_minutes=60,
                description="Flagship thematic dance competition across student houses/departments.",
                priority=1,
            ),
            TemplateActivity(
                title="Celebrity / Guest Band Performance",
                activity_type=ActivityType.ACTIVITY,
                default_duration_minutes=75,
                min_duration_minutes=45,
                description="Special evening musical showcase for festival attendees.",
                priority=3,
            ),
            TemplateActivity(
                title="Awards Announcement & Fest Conclusion",
                activity_type=ActivityType.AWARDS,
                default_duration_minutes=35,
                min_duration_minutes=20,
                description="Announcing winners of cultural cups and student appreciation vote of thanks.",
                priority=1,
            ),
        ],
    ),
    EventType.SPORTS_EVENT: EventTemplate(
        event_type=EventType.SPORTS_EVENT,
        name="Inter-Collegiate Sports Meet / Tournament",
        description="Outdoor and indoor track, field, and team sporting events.",
        recommended_setup_minutes=45,
        recommended_cleanup_minutes=45,
        day_1_activities=[
            TemplateActivity(
                title="Athlete Reporting, Bib Collection & Warm-ups",
                activity_type=ActivityType.REGISTRATION,
                default_duration_minutes=45,
                min_duration_minutes=25,
                description="Registration of athletes, medical checks, and field access assignment.",
                priority=1,
            ),
            TemplateActivity(
                title="Opening March-Past & Athletes' Oath",
                activity_type=ActivityType.OPENING,
                default_duration_minutes=30,
                min_duration_minutes=15,
                description="Parade of house contingents, torch lighting, and sportsmanship pledge.",
                priority=1,
            ),
            TemplateActivity(
                title="Morning Track & Field Preliminaries",
                activity_type=ActivityType.COMPETITION,
                default_duration_minutes=120,
                min_duration_minutes=75,
                description="Heats, sprint trials, and qualifying jumps/throws.",
                priority=1,
            ),
            TemplateActivity(
                title="Team Sport Fixtures / Semi-Final Rounds",
                activity_type=ActivityType.COMPETITION,
                default_duration_minutes=120,
                min_duration_minutes=75,
                description="Competitive matches across volleyball, football, basketball, or cricket.",
                priority=2,
            ),
            TemplateActivity(
                title="Championship Final Matches",
                activity_type=ActivityType.COMPETITION,
                default_duration_minutes=90,
                min_duration_minutes=60,
                description="Final deciding games across primary tournament sports.",
                priority=1,
            ),
            TemplateActivity(
                title="Podium Medal Ceremony & Closing March-Down",
                activity_type=ActivityType.AWARDS,
                default_duration_minutes=40,
                min_duration_minutes=25,
                description="Medal conferral, best athlete trophy presentation, and athletic flag handover.",
                priority=1,
            ),
        ],
    ),
    EventType.FAREWELL: EventTemplate(
        event_type=EventType.FAREWELL,
        name="Graduation Farewell & Memento Celebration",
        description="Sentimental tribute ceremony for graduating batches.",
        recommended_setup_minutes=45,
        recommended_cleanup_minutes=45,
        day_1_activities=[
            TemplateActivity(
                title="Arrival Reception & Photo Wall Gathering",
                activity_type=ActivityType.REGISTRATION,
                default_duration_minutes=45,
                min_duration_minutes=25,
                description="Graduates gather for candid class photography, autograph books, and name tags.",
                priority=1,
            ),
            TemplateActivity(
                title="Opening Welcome Address by Junior Batch",
                activity_type=ActivityType.OPENING,
                default_duration_minutes=25,
                min_duration_minutes=15,
                description="Heartfelt welcome speech, theme dedication, and event roadmap.",
                priority=1,
            ),
            TemplateActivity(
                title="Faculty Addresses & Inspiring Messages",
                activity_type=ActivityType.SESSION,
                default_duration_minutes=40,
                min_duration_minutes=25,
                description="Faculty members share memories and inspirational guidance for future careers.",
                priority=2,
            ),
            TemplateActivity(
                title="Nostalgia Slideshow & Student Memory Sharing",
                activity_type=ActivityType.ACTIVITY,
                default_duration_minutes=35,
                min_duration_minutes=20,
                description="Retrospective photo/video screening celebrating college years.",
                priority=2,
            ),
            TemplateActivity(
                title="Memento & Title Citations Distribution",
                activity_type=ActivityType.AWARDS,
                default_duration_minutes=60,
                min_duration_minutes=40,
                description="Individual mementos, yearbooks, and affectionate batch titles conferral.",
                priority=1,
            ),
            TemplateActivity(
                title="Student Musical Performance & Open Stage",
                activity_type=ActivityType.ACTIVITY,
                default_duration_minutes=45,
                min_duration_minutes=30,
                description="Acoustic songs, stand-up comedy, and informal batch performances.",
                priority=3,
            ),
            TemplateActivity(
                title="Concluding Farewell Address & Batch Photo",
                activity_type=ActivityType.CLOSING,
                default_duration_minutes=25,
                min_duration_minutes=15,
                description="Final group photograph, parting thoughts, and official farewell closure.",
                priority=1,
            ),
        ],
    ),
    EventType.DEPARTMENT_EVENT: EventTemplate(
        event_type=EventType.DEPARTMENT_EVENT,
        name="Academic Department Seminar & Project Showcase",
        description="Departmental symposium, alumni talks, capstone exhibits, and academic honors.",
        recommended_setup_minutes=30,
        recommended_cleanup_minutes=30,
        day_1_activities=[
            TemplateActivity(
                title="Faculty & Student Attendance Sign-in",
                activity_type=ActivityType.REGISTRATION,
                default_duration_minutes=30,
                min_duration_minutes=15,
                description="Sign-in and distribution of department event abstract booklets.",
                priority=1,
            ),
            TemplateActivity(
                title="Head of Department Welcome & Annual Review",
                activity_type=ActivityType.OPENING,
                default_duration_minutes=25,
                min_duration_minutes=15,
                description="Department milestones, research grants, and student achievements highlight.",
                priority=1,
            ),
            TemplateActivity(
                title="Guest Lecture / Distinguished Alumni Talk",
                activity_type=ActivityType.KEYNOTE,
                default_duration_minutes=50,
                min_duration_minutes=35,
                description="Invited talk on industry practices and career roadmap.",
                priority=1,
            ),
            TemplateActivity(
                title="Undergraduate Capstone Project Showcase",
                activity_type=ActivityType.SESSION,
                default_duration_minutes=80,
                min_duration_minutes=50,
                description="Student poster presentations and software/hardware model demonstrations.",
                priority=1,
            ),
            TemplateActivity(
                title="Departmental Academic Honors & Certificates",
                activity_type=ActivityType.AWARDS,
                default_duration_minutes=25,
                min_duration_minutes=15,
                description="Awards for semester rank-holders and outstanding student researchers.",
                priority=2,
            ),
            TemplateActivity(
                title="Vote of Thanks & Academic Adjournment",
                activity_type=ActivityType.CLOSING,
                default_duration_minutes=15,
                min_duration_minutes=10,
                description="Concluding acknowledgements and department association remarks.",
                priority=2,
            ),
        ],
    ),
    EventType.OTHER: EventTemplate(
        event_type=EventType.OTHER,
        name="General Event Schedule Template",
        description="Flexible, balanced layout suitable for community, club, or miscellaneous college gatherings.",
        recommended_setup_minutes=30,
        recommended_cleanup_minutes=30,
        day_1_activities=[
            TemplateActivity(
                title="Attendee Reception & Welcome Desk",
                activity_type=ActivityType.REGISTRATION,
                default_duration_minutes=30,
                min_duration_minutes=15,
                description="Check-in and welcome greeting.",
                priority=1,
            ),
            TemplateActivity(
                title="Welcome Remarks & Agenda Orientation",
                activity_type=ActivityType.OPENING,
                default_duration_minutes=20,
                min_duration_minutes=10,
                description="Opening greeting and briefing on the event plan.",
                priority=1,
            ),
            TemplateActivity(
                title="Main Activity / Core Gathering - Session 1",
                activity_type=ActivityType.ACTIVITY,
                default_duration_minutes=90,
                min_duration_minutes=45,
                description="Primary scheduled program or meeting agenda.",
                priority=1,
            ),
            TemplateActivity(
                title="Collaborative Session / Open Discussion - Session 2",
                activity_type=ActivityType.SESSION,
                default_duration_minutes=75,
                min_duration_minutes=45,
                description="Interactive group dialogue, breakout discussions, or audience engagement.",
                priority=2,
            ),
            TemplateActivity(
                title="Summary, Feedback & Closing Remarks",
                activity_type=ActivityType.CLOSING,
                default_duration_minutes=25,
                min_duration_minutes=15,
                description="Review of key takeaways, participant appreciation, and conclusion.",
                priority=1,
            ),
        ],
    ),
}


def get_template_for_event_type(event_type: EventType) -> EventTemplate:
    """
    Retrieves the corresponding template for a given EventType.
    Falls back safely to EventType.OTHER if unmapped.
    """
    if event_type in EVENT_TEMPLATES:
        return EVENT_TEMPLATES[event_type]
    return EVENT_TEMPLATES[EventType.OTHER]
