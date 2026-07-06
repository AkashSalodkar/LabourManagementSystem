using LMPTS.Entities;

public class AttendanceRecord
{
    public int AttendanceRecordId { get; set; }

    public int LaborId { get; set; }

    public Labor Labor { get; set; } = null!;

    public DateOnly AttendanceDate { get; set; }

    public AttendanceStatus Status { get; set; }

    public decimal DailyRate { get; set; }

    public decimal OvertimeHours { get; set; }

    public decimal TotalHoursWorked { get; set; }

    public decimal OvertimeRate { get; set; }

    public decimal Bonus { get; set; }

    public decimal Deduction { get; set; }

    public string? Remarks { get; set; }

    public decimal TotalCostSpent =>
        Status switch
        {
            AttendanceStatus.Absent => 0,

            AttendanceStatus.HalfDay => (DailyRate / 2)
                                       + (OvertimeHours * OvertimeRate)
                                       + Bonus
                                       - Deduction,

            AttendanceStatus.Present => DailyRate
                                        + (OvertimeHours * OvertimeRate)
                                        + Bonus
                                        - Deduction,

            _ => 0
        };
}

public enum AttendanceStatus
{
    Absent = 0,
    Present = 1,
    HalfDay = 2
}